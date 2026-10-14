package com.personalearn.controller;

import com.personalearn.dto.Dtos.*;
import com.personalearn.repository.EnrollmentRepository;
import com.personalearn.repository.LessonProgressRepository;
import com.personalearn.repository.UserRepository;
import com.personalearn.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CourseService courses;
    private final UserRepository users;
    private final EnrollmentRepository enrollments;
    private final LessonProgressRepository progress;

    public AdminController(CourseService courses, UserRepository users,
                           EnrollmentRepository enrollments, LessonProgressRepository progress) {
        this.courses = courses;
        this.users = users;
        this.enrollments = enrollments;
        this.progress = progress;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Long> typeDistribution = new TreeMap<>();
        users.findAll().forEach(u -> {
            if (u.getMbtiType() != null) typeDistribution.merge(u.getMbtiType(), 1L, Long::sum);
        });
        return Map.of(
                "users", users.count(),
                "courses", courses.list(null, null, null).size(),
                "enrollments", enrollments.count(),
                "lessonsCompleted", progress.count(),
                "typeDistribution", typeDistribution);
    }

    @PostMapping("/courses")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseSummary create(@Valid @RequestBody CourseRequest req) {
        return courses.create(req);
    }

    @PutMapping("/courses/{id}")
    public CourseSummary update(@PathVariable Long id, @Valid @RequestBody CourseRequest req) {
        return courses.update(id, req);
    }

    @DeleteMapping("/courses/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        courses.delete(id);
        return Map.of("message", "Course deleted");
    }

    @GetMapping("/courses/{id}/lessons")
    public List<LessonDto> lessons(@PathVariable Long id) {
        return courses.lessonsForAdmin(id);
    }

    @PostMapping("/courses/{id}/lessons")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonDto addLesson(@PathVariable Long id, @Valid @RequestBody LessonRequest req) {
        return courses.addLesson(id, req);
    }

    @PutMapping("/lessons/{id}")
    public LessonDto updateLesson(@PathVariable Long id, @Valid @RequestBody LessonRequest req) {
        return courses.updateLesson(id, req);
    }

    @DeleteMapping("/lessons/{id}")
    public Map<String, String> deleteLesson(@PathVariable Long id) {
        courses.deleteLesson(id);
        return Map.of("message", "Lesson deleted");
    }
}
