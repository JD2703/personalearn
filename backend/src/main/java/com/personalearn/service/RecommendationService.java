package com.personalearn.service;

import com.personalearn.dto.Dtos.Recommendation;
import com.personalearn.model.Course;
import com.personalearn.model.Enrollment;
import com.personalearn.model.Lesson;
import com.personalearn.model.User;
import com.personalearn.repository.CourseRepository;
import com.personalearn.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Adaptive recommendation engine.
 *
 * Each candidate course gets a match score (0-100) built from four signals:
 *   50% personality fit  – overlap between the course's target traits and the learner's MBTI letters,
 *                          weighted by how strong each preference is
 *   30% format fit       – share of the course's lessons delivered in the learner's preferred formats
 *   15% level fit        – adapts to the learner's progress (beginner → intermediate → advanced per category)
 *    5% interest         – categories the learner has already engaged with
 */
@Service
public class RecommendationService {

    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final MbtiService mbti;
    private final CourseService courseService;

    public RecommendationService(CourseRepository courses, EnrollmentRepository enrollments,
                                 MbtiService mbti, CourseService courseService) {
        this.courses = courses;
        this.enrollments = enrollments;
        this.mbti = mbti;
        this.courseService = courseService;
    }

    @Transactional(readOnly = true)
    public List<Recommendation> recommend(User user, int limit) {
        List<Enrollment> mine = enrollments.findByUserIdOrderByLastAccessedAtDesc(user.getId());
        Set<Long> enrolledIds = mine.stream().map(e -> e.getCourse().getId()).collect(Collectors.toSet());

        // Highest level completed per category (drives adaptive difficulty)
        Map<String, Integer> completedLevel = new HashMap<>();
        Set<String> interests = new HashSet<>();
        for (Enrollment e : mine) {
            interests.add(e.getCourse().getCategory());
            if (e.getCompletedAt() != null) {
                completedLevel.merge(e.getCourse().getCategory(), e.getCourse().getLevel().ordinal() + 1, Math::max);
            }
        }

        String type = user.getMbtiType();
        MbtiService.TypeProfile profile = type == null ? null : mbti.profile(type);

        return courses.findAll().stream()
                .filter(c -> !enrolledIds.contains(c.getId()))
                .map(c -> score(c, user, profile, completedLevel, interests))
                .sorted(Comparator.comparingInt(Recommendation::matchPercent).reversed())
                .limit(limit)
                .toList();
    }

    private Recommendation score(Course c, User u, MbtiService.TypeProfile profile,
                                 Map<String, Integer> completedLevel, Set<String> interests) {
        List<String> reasons = new ArrayList<>();

        // 1. Personality fit
        double traitScore = 0.5; // neutral when type unknown / course untagged
        if (profile != null && c.getTraits() != null && !c.getTraits().isBlank()) {
            String type = profile.type();
            double sum = 0;
            List<Character> matched = new ArrayList<>();
            for (char t : c.getTraits().toCharArray()) {
                double strength = strength(u, t); // 0.5..1 if the learner leans that way, 0..0.5 otherwise
                sum += strength;
                if (type.indexOf(t) >= 0) matched.add(t);
            }
            traitScore = sum / c.getTraits().length();
            if (!matched.isEmpty()) {
                reasons.add("Designed for " + describe(matched) + " learners like you");
            }
        }

        // 2. Format fit
        double formatScore = 0.5;
        if (profile != null && !c.getLessons().isEmpty()) {
            Set<Lesson.Format> pref = new HashSet<>(profile.preferredFormats());
            long fit = c.getLessons().stream().filter(l -> pref.contains(l.getFormat())).count();
            formatScore = fit / (double) c.getLessons().size();
            if (formatScore >= 0.5) {
                Lesson.Format top = c.getLessons().stream().map(Lesson::getFormat).filter(pref::contains)
                        .collect(Collectors.groupingBy(f -> f, Collectors.counting()))
                        .entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
                if (top != null) reasons.add("Heavy on " + top.name().toLowerCase() + " lessons — your preferred format");
            }
        }

        // 3. Adaptive level fit
        int done = completedLevel.getOrDefault(c.getCategory(), 0); // 0 none, 1 beginner, 2 intermediate, 3 advanced
        int target = Math.min(done, 2); // next ordinal to take
        int diff = Math.abs(c.getLevel().ordinal() - target);
        double levelScore = diff == 0 ? 1.0 : diff == 1 ? 0.45 : 0.1;
        if (diff == 0 && done > 0) reasons.add("Next step after completing " + c.getCategory() + " level " + done);
        else if (diff == 0 && c.getLevel() == Course.Level.BEGINNER) reasons.add("Beginner-friendly starting point");

        // 4. Interest
        double interestScore = interests.contains(c.getCategory()) ? 1.0 : 0.3;
        if (interests.contains(c.getCategory())) reasons.add("Matches your interest in " + c.getCategory());

        int pct = (int) Math.round(100 * (0.50 * traitScore + 0.30 * formatScore + 0.15 * levelScore + 0.05 * interestScore));
        pct = Math.max(1, Math.min(99, pct));
        if (reasons.isEmpty()) reasons.add("Broadens your skills with a new perspective");
        return new Recommendation(courseService.summary(c), pct, reasons);
    }

    /** How strongly the learner leans toward a given letter, 0..1. */
    private double strength(User u, char letter) {
        Integer e = u.getScoreE(), n = u.getScoreN(), t = u.getScoreT(), j = u.getScoreJ();
        Integer v = switch (letter) {
            case 'E' -> e; case 'I' -> e == null ? null : 100 - e;
            case 'N' -> n; case 'S' -> n == null ? null : 100 - n;
            case 'T' -> t; case 'F' -> t == null ? null : 100 - t;
            case 'J' -> j; case 'P' -> j == null ? null : 100 - j;
            default -> null;
        };
        if (v == null) {
            return u.getMbtiType() != null && u.getMbtiType().indexOf(letter) >= 0 ? 0.75 : 0.25;
        }
        return v / 100.0;
    }

    private String describe(List<Character> letters) {
        Map<Character, String> words = Map.of(
                'E', "social", 'I', "reflective", 'S', "practical", 'N', "big-picture",
                'T', "analytical", 'F', "people-focused", 'J', "structured", 'P', "exploratory");
        List<String> w = letters.stream().map(words::get).toList();
        if (w.size() == 1) return w.get(0);
        return String.join(", ", w.subList(0, w.size() - 1)) + " and " + w.get(w.size() - 1);
    }
}
