package com.personalearn.dto;

import com.personalearn.model.Course;
import com.personalearn.model.Lesson;
import com.personalearn.model.User;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Request / response payloads for the REST API. */
public final class Dtos {
    private Dtos() {}

    // ---------- Auth ----------
    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 100) String password) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record AuthResponse(String token, UserDto user) {}

    public record UserDto(Long id, String name, String email, String role, String mbtiType,
                          Integer scoreE, Integer scoreN, Integer scoreT, Integer scoreJ, Instant createdAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getMbtiType(),
                    u.getScoreE(), u.getScoreN(), u.getScoreT(), u.getScoreJ(), u.getCreatedAt());
        }
    }

    public record UpdateProfileRequest(@NotBlank @Size(max = 100) String name) {}

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 6, max = 100) String newPassword) {}

    // ---------- MBTI ----------
    public record MbtiSubmitRequest(@NotNull Map<Integer, Integer> answers) {}

    public record MbtiManualRequest(@NotBlank @Pattern(regexp = "(?i)[EI][SN][TF][JP]") String type) {}

    // ---------- Courses ----------
    public record CourseSummary(Long id, String title, String description, String category, String level,
                                String instructor, String traits, String color, int lessonCount,
                                int totalMinutes, long enrolledCount) {
        public static CourseSummary from(Course c, long enrolledCount) {
            return new CourseSummary(c.getId(), c.getTitle(), c.getDescription(), c.getCategory(),
                    c.getLevel().name(), c.getInstructor(), c.getTraits(), c.getColor(),
                    c.getLessons().size(),
                    c.getLessons().stream().mapToInt(Lesson::getDurationMinutes).sum(),
                    enrolledCount);
        }
    }

    public record LessonDto(Long id, String title, String content, String format, int durationMinutes,
                            int orderIndex, boolean completed) {
        public static LessonDto from(Lesson l, boolean completed, boolean includeContent) {
            return new LessonDto(l.getId(), l.getTitle(), includeContent ? l.getContent() : null,
                    l.getFormat().name(), l.getDurationMinutes(), l.getOrderIndex(), completed);
        }
    }

    public record CourseDetail(CourseSummary course, List<LessonDto> lessons, boolean enrolled,
                               int progressPercent, Long nextLessonId, String personalizedTip) {}

    public record CourseRequest(
            @NotBlank @Size(max = 150) String title,
            @Size(max = 2000) String description,
            @NotBlank @Size(max = 60) String category,
            @NotNull Course.Level level,
            @Size(max = 80) String instructor,
            @Pattern(regexp = "(?i)[EISNTFJP]{0,8}") String traits,
            @Pattern(regexp = "#[0-9a-fA-F]{6}") String color) {}

    public record LessonRequest(
            @NotBlank @Size(max = 150) String title,
            String content,
            @NotNull Lesson.Format format,
            @Min(1) @Max(600) int durationMinutes,
            Integer orderIndex) {}

    // ---------- Progress ----------
    public record EnrollmentDto(CourseSummary course, int progressPercent, int completedLessons,
                                Long nextLessonId, String nextLessonTitle,
                                Instant enrolledAt, Instant completedAt, Instant lastAccessedAt) {}

    public record DashboardDto(
            UserDto user,
            int enrolledCourses,
            int completedCourses,
            long lessonsCompleted,
            long minutesLearned,
            int streakDays,
            List<DailyActivity> weeklyActivity,
            List<EnrollmentDto> continueLearning,
            List<Recommendation> recommendations,
            Map<String, Integer> formatBreakdown) {}

    public record DailyActivity(String date, String label, long lessons) {}

    public record Recommendation(CourseSummary course, int matchPercent, List<String> reasons) {}

    // ---------- Chat ----------
    public record ChatRequest(@NotBlank @Size(max = 2000) String message) {}

    public record ChatMessageDto(Long id, String sender, String content, Instant createdAt,
                                 List<String> suggestions) {}
}
