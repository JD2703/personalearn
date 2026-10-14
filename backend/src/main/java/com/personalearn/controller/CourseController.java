package com.personalearn.controller;

import com.personalearn.dto.Dtos.*;
import com.personalearn.security.AuthUser;
import com.personalearn.service.CourseService;
import com.personalearn.service.ProgressService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CourseController {

    private final CourseService courses;
    private final ProgressService progress;

    public CourseController(CourseService courses, ProgressService progress) {
        this.courses = courses;
        this.progress = progress;
    }

    @GetMapping("/courses")
    public List<CourseSummary> list(@RequestParam(required = false) String search,
                                    @RequestParam(required = false) String category,
                                    @RequestParam(required = false) String level) {
        return courses.list(search, category, level);
    }

    @GetMapping("/courses/categories")
    public List<String> categories() {
        return courses.categories();
    }

    @GetMapping("/courses/{id}")
    public CourseDetail detail(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return courses.detail(id, user == null ? null : user.id());
    }

    @PostMapping("/courses/{id}/enroll")
    public EnrollmentDto enroll(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return progress.enroll(user.id(), id);
    }

    @DeleteMapping("/courses/{id}/enroll")
    public Map<String, String> unenroll(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        progress.unenroll(user.id(), id);
        return Map.of("message", "Unenrolled");
    }

    @PutMapping("/lessons/{id}/complete")
    public EnrollmentDto complete(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return progress.setLessonComplete(user.id(), id, true);
    }

    @DeleteMapping("/lessons/{id}/complete")
    public EnrollmentDto uncomplete(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return progress.setLessonComplete(user.id(), id, false);
    }

    @GetMapping("/my/courses")
    public List<EnrollmentDto> myCourses(@AuthenticationPrincipal AuthUser user) {
        return progress.myCourses(user.id());
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard(@AuthenticationPrincipal AuthUser user) {
        return progress.dashboard(user.id());
    }
}
