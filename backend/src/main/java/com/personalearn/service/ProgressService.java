package com.personalearn.service;

import com.personalearn.config.ApiException;
import com.personalearn.dto.Dtos.*;
import com.personalearn.model.*;
import com.personalearn.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class ProgressService {

    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository progress;
    private final LessonRepository lessons;
    private final UserRepository users;
    private final CourseService courseService;
    private final RecommendationService recommendations;

    public ProgressService(EnrollmentRepository enrollments, LessonProgressRepository progress,
                           LessonRepository lessons, UserRepository users,
                           CourseService courseService, RecommendationService recommendations) {
        this.enrollments = enrollments;
        this.progress = progress;
        this.lessons = lessons;
        this.users = users;
        this.courseService = courseService;
        this.recommendations = recommendations;
    }

    @Transactional
    public EnrollmentDto enroll(Long userId, Long courseId) {
        Course c = courseService.find(courseId);
        Enrollment e = enrollments.findByUserIdAndCourseId(userId, courseId).orElseGet(() -> {
            Enrollment n = new Enrollment();
            n.setUser(users.getReferenceById(userId));
            n.setCourse(c);
            return enrollments.save(n);
        });
        return toDto(e, userId);
    }

    @Transactional
    public void unenroll(Long userId, Long courseId) {
        Enrollment e = enrollments.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> ApiException.notFound("Enrollment"));
        enrollments.delete(e);
    }

    @Transactional
    public EnrollmentDto setLessonComplete(Long userId, Long lessonId, boolean complete) {
        Lesson lesson = lessons.findById(lessonId).orElseThrow(() -> ApiException.notFound("Lesson"));
        Long courseId = lesson.getCourse().getId();
        Enrollment e = enrollments.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> ApiException.badRequest("Enroll in the course before tracking progress"));

        Optional<LessonProgress> existing = progress.findByUserIdAndLessonId(userId, lessonId);
        if (complete && existing.isEmpty()) {
            LessonProgress lp = new LessonProgress();
            lp.setUser(users.getReferenceById(userId));
            lp.setLesson(lesson);
            progress.save(lp);
        } else if (!complete) {
            existing.ifPresent(progress::delete);
            progress.flush();
        }

        long total = lessons.countByCourseId(courseId);
        long done = progress.findCompletedLessonIds(userId, courseId).size();
        e.setCompletedAt(total > 0 && done >= total ? (e.getCompletedAt() != null ? e.getCompletedAt() : Instant.now()) : null);
        e.setLastAccessedAt(Instant.now());
        enrollments.save(e);
        return toDto(e, userId);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDto> myCourses(Long userId) {
        return enrollments.findByUserIdOrderByLastAccessedAtDesc(userId).stream()
                .map(e -> toDto(e, userId)).toList();
    }

    @Transactional(readOnly = true)
    public DashboardDto dashboard(Long userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        List<EnrollmentDto> mine = myCourses(userId);
        List<LessonProgress> all = progress.findAllByUserWithLesson(userId);

        long minutes = all.stream().mapToLong(lp -> lp.getLesson().getDurationMinutes()).sum();
        ZoneId zone = ZoneOffset.UTC;
        LocalDate today = LocalDate.now(zone);

        Map<LocalDate, Long> perDay = new HashMap<>();
        Map<String, Integer> formats = new TreeMap<>();
        for (LessonProgress lp : all) {
            perDay.merge(lp.getCompletedAt().atZone(zone).toLocalDate(), 1L, Long::sum);
            formats.merge(lp.getLesson().getFormat().name(), 1, Integer::sum);
        }

        List<DailyActivity> week = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            week.add(new DailyActivity(d.toString(), d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    perDay.getOrDefault(d, 0L)));
        }

        // Streak: consecutive days with activity ending today (or yesterday)
        int streak = 0;
        LocalDate cursor = perDay.containsKey(today) ? today : today.minusDays(1);
        while (perDay.containsKey(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }

        List<EnrollmentDto> continueLearning = mine.stream()
                .filter(e -> e.completedAt() == null).limit(3).toList();

        return new DashboardDto(
                UserDto.from(user),
                mine.size(),
                (int) mine.stream().filter(e -> e.completedAt() != null).count(),
                all.size(),
                minutes,
                streak,
                week,
                continueLearning,
                recommendations.recommend(user, 4),
                formats);
    }

    private EnrollmentDto toDto(Enrollment e, Long userId) {
        Course c = e.getCourse();
        Set<Long> done = new HashSet<>(progress.findCompletedLessonIds(userId, c.getId()));
        int total = c.getLessons().size();
        int pct = total == 0 ? 0 : (int) Math.round(done.size() * 100.0 / total);
        Lesson next = c.getLessons().stream().filter(l -> !done.contains(l.getId())).findFirst().orElse(null);
        return new EnrollmentDto(courseService.summary(c), pct, done.size(),
                next == null ? null : next.getId(), next == null ? null : next.getTitle(),
                e.getEnrolledAt(), e.getCompletedAt(), e.getLastAccessedAt());
    }
}
