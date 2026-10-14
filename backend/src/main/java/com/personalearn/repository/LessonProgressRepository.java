package com.personalearn.repository;

import com.personalearn.model.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

    @Query("select lp.lesson.id from LessonProgress lp where lp.user.id = :userId and lp.lesson.course.id = :courseId")
    List<Long> findCompletedLessonIds(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("select lp from LessonProgress lp join fetch lp.lesson l where lp.user.id = :userId order by lp.completedAt desc")
    List<LessonProgress> findAllByUserWithLesson(@Param("userId") Long userId);

    long countByUserId(Long userId);

    @Modifying
    @Query("delete from LessonProgress lp where lp.lesson.id in (select l.id from Lesson l where l.course.id = :courseId)")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from LessonProgress lp where lp.lesson.id = :lessonId")
    void deleteByLessonId(@Param("lessonId") Long lessonId);
}
