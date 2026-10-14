package com.personalearn.service;

import com.personalearn.config.ApiException;
import com.personalearn.dto.Dtos.*;
import com.personalearn.model.Course;
import com.personalearn.model.Lesson;
import com.personalearn.model.User;
import com.personalearn.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CourseService {

    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository progress;
    private final UserRepository users;
    private final MbtiService mbti;

    public CourseService(CourseRepository courses, LessonRepository lessons, EnrollmentRepository enrollments,
                         LessonProgressRepository progress, UserRepository users, MbtiService mbti) {
        this.courses = courses;
        this.lessons = lessons;
        this.enrollments = enrollments;
        this.progress = progress;
        this.users = users;
        this.mbti = mbti;
    }

    @Transactional(readOnly = true)
    public List<CourseSummary> list(String search, String category, String level) {
        String q = search == null ? "" : search.trim().toLowerCase();
        Map<Long, Long> counts = enrollmentCounts();
        return courses.findAll().stream()
                .filter(c -> q.isEmpty()
                        || c.getTitle().toLowerCase().contains(q)
                        || (c.getDescription() != null && c.getDescription().toLowerCase().contains(q))
                        || c.getCategory().toLowerCase().contains(q))
                .filter(c -> category == null || category.isBlank() || c.getCategory().equalsIgnoreCase(category))
                .filter(c -> level == null || level.isBlank() || c.getLevel().name().equalsIgnoreCase(level))
                .sorted(Comparator.comparing(Course::getId))
                .map(c -> summary(c, counts))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> categories() {
        return courses.findAllCategories();
    }

    @Transactional(readOnly = true)
    public CourseDetail detail(Long courseId, Long userId) {
        Course c = find(courseId);
        boolean enrolled = userId != null && enrollments.existsByUserIdAndCourseId(userId, courseId);
        Set<Long> done = userId == null ? Set.of() : new HashSet<>(progress.findCompletedLessonIds(userId, courseId));

        List<LessonDto> lessonDtos = c.getLessons().stream()
                .map(l -> LessonDto.from(l, done.contains(l.getId()), enrolled))
                .toList();
        int pct = c.getLessons().isEmpty() ? 0 : (int) Math.round(done.size() * 100.0 / c.getLessons().size());
        Long next = c.getLessons().stream().filter(l -> !done.contains(l.getId())).map(Lesson::getId).findFirst().orElse(null);

        String tip = null;
        if (userId != null) {
            User u = users.findById(userId).orElse(null);
            if (u != null && u.getMbtiType() != null) tip = personalizedTip(c, u.getMbtiType());
        }
        return new CourseDetail(summary(c), lessonDtos, enrolled, pct, next, tip);
    }

    /** Suggests how a learner of a given type should approach this specific course. */
    String personalizedTip(Course c, String type) {
        var profile = mbti.profile(type);
        Map<Lesson.Format, Long> formatCounts = new EnumMap<>(Lesson.Format.class);
        c.getLessons().forEach(l -> formatCounts.merge(l.getFormat(), 1L, Long::sum));
        Optional<Lesson.Format> fav = profile.preferredFormats().stream()
                .filter(formatCounts::containsKey).findFirst();
        StringBuilder sb = new StringBuilder("As an ").append(type).append(" (").append(profile.nickname()).append("), ");
        if (fav.isPresent()) {
            sb.append("you'll likely enjoy the ").append(fav.get().name().toLowerCase())
              .append(" lessons in this course most. ");
        } else {
            sb.append("this course stretches you beyond your usual formats — a great chance to grow. ");
        }
        sb.append(type.charAt(3) == 'J'
                ? "Plan to finish " + Math.max(1, c.getLessons().size() / 3) + " lessons per session to complete it in about three sittings."
                : "Try one lesson at a time in short focused sprints, and jump to the project early if you get curious.");
        return sb.toString();
    }

    // ---------- Admin ----------

    @Transactional
    public CourseSummary create(CourseRequest req) {
        Course c = new Course();
        apply(c, req);
        return summary(courses.save(c));
    }

    @Transactional
    public CourseSummary update(Long id, CourseRequest req) {
        Course c = find(id);
        apply(c, req);
        return summary(courses.save(c));
    }

    @Transactional
    public void delete(Long id) {
        Course c = find(id);
        progress.deleteByCourseId(id);
        enrollments.deleteByCourseId(id);
        courses.delete(c);
    }

    @Transactional
    public LessonDto addLesson(Long courseId, LessonRequest req) {
        Course c = find(courseId);
        Lesson l = new Lesson();
        applyLesson(l, req, c.getLessons().size() + 1);
        c.addLesson(l);
        courses.save(c);
        return LessonDto.from(l, false, true);
    }

    @Transactional
    public LessonDto updateLesson(Long lessonId, LessonRequest req) {
        Lesson l = lessons.findById(lessonId).orElseThrow(() -> ApiException.notFound("Lesson"));
        applyLesson(l, req, l.getOrderIndex());
        return LessonDto.from(lessons.save(l), false, true);
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        Lesson l = lessons.findById(lessonId).orElseThrow(() -> ApiException.notFound("Lesson"));
        progress.deleteByLessonId(lessonId);
        Course c = l.getCourse();
        c.getLessons().remove(l);
        courses.save(c);
    }

    @Transactional(readOnly = true)
    public List<LessonDto> lessonsForAdmin(Long courseId) {
        return find(courseId).getLessons().stream().map(l -> LessonDto.from(l, false, true)).toList();
    }

    // ---------- helpers ----------

    Course find(Long id) {
        return courses.findById(id).orElseThrow(() -> ApiException.notFound("Course"));
    }

    CourseSummary summary(Course c) {
        return CourseSummary.from(c, enrollments.countByCourseId(c.getId()));
    }

    /** Uses pre-loaded enrolment counts, avoiding one query per course. */
    CourseSummary summary(Course c, Map<Long, Long> counts) {
        return CourseSummary.from(c, counts.getOrDefault(c.getId(), 0L));
    }

    /** Enrolment count per course id, loaded in a single query. */
    Map<Long, Long> enrollmentCounts() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : enrollments.countPerCourse()) {
            counts.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    private void apply(Course c, CourseRequest req) {
        c.setTitle(req.title().trim());
        c.setDescription(req.description());
        c.setCategory(req.category().trim());
        c.setLevel(req.level());
        c.setInstructor(req.instructor());
        c.setTraits(req.traits());
        if (req.color() != null) c.setColor(req.color());
    }

    private void applyLesson(Lesson l, LessonRequest req, int defaultOrder) {
        l.setTitle(req.title().trim());
        l.setContent(req.content());
        l.setFormat(req.format());
        l.setDurationMinutes(req.durationMinutes());
        l.setOrderIndex(req.orderIndex() != null ? req.orderIndex() : defaultOrder);
    }
}
