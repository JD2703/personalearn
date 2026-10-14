package com.personalearn.security;

/** Authenticated principal extracted from a validated JWT. */
public record AuthUser(Long id, String email, String role) {
    public boolean isAdmin() { return "ADMIN".equals(role); }
}
