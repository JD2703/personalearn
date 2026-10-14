package com.personalearn.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, length = 60)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Level level = Level.BEGINNER;

    @Column(length = 80)
    private String instructor;

    /**
     * Personality traits this course is designed for, as MBTI letters (e.g. "NTJ" or "ESF").
     * Used by the recommendation engine.
     */
    @Column(length = 8)
    private String traits = "";

    /** Accent colour used for the course card in the UI. */
    @Column(length = 10)
    private String color = "#5b5bd6";

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<Lesson> lessons = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Level { BEGINNER, INTERMEDIATE, ADVANCED }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Level getLevel() { return level; }
    public void setLevel(Level level) { this.level = level; }
    public String getInstructor() { return instructor; }
    public void setInstructor(String instructor) { this.instructor = instructor; }
    public String getTraits() { return traits; }
    public void setTraits(String traits) { this.traits = traits == null ? "" : traits.toUpperCase(); }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public List<Lesson> getLessons() { return lessons; }
    public Instant getCreatedAt() { return createdAt; }

    public void addLesson(Lesson lesson) {
        lesson.setCourse(this);
        lessons.add(lesson);
    }
}
