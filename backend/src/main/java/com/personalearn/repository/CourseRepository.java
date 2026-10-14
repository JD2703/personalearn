package com.personalearn.repository;

import com.personalearn.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    @Query("select distinct c.category from Course c order by c.category")
    List<String> findAllCategories();
}
