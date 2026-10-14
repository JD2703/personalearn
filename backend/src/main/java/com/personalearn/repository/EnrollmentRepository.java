package com.personalearn.repository;

import com.personalearn.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUserIdOrderByLastAccessedAtDesc(Long userId);
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
    long countByCourseId(Long courseId);
    void deleteByCourseId(Long courseId);

    @Query("select e.course.id, count(e) from Enrollment e group by e.course.id")
    List<Object[]> countPerCourse();
}
