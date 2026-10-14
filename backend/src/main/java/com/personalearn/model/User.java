package com.personalearn.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.STUDENT;

    @Column(name = "mbti_type", length = 4)
    private String mbtiType;

    /** Percentage scores for E, N, T, J (0-100). The opposite letter is 100 - value. */
    private Integer scoreE;
    private Integer scoreN;
    private Integer scoreT;
    private Integer scoreJ;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Role { STUDENT, ADMIN }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getMbtiType() { return mbtiType; }
    public void setMbtiType(String mbtiType) { this.mbtiType = mbtiType; }
    public Integer getScoreE() { return scoreE; }
    public void setScoreE(Integer scoreE) { this.scoreE = scoreE; }
    public Integer getScoreN() { return scoreN; }
    public void setScoreN(Integer scoreN) { this.scoreN = scoreN; }
    public Integer getScoreT() { return scoreT; }
    public void setScoreT(Integer scoreT) { this.scoreT = scoreT; }
    public Integer getScoreJ() { return scoreJ; }
    public void setScoreJ(Integer scoreJ) { this.scoreJ = scoreJ; }
    public Instant getCreatedAt() { return createdAt; }
}
