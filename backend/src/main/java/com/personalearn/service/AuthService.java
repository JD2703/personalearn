package com.personalearn.service;

import com.personalearn.config.ApiException;
import com.personalearn.dto.Dtos.*;
import com.personalearn.model.User;
import com.personalearn.repository.UserRepository;
import com.personalearn.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final MbtiService mbti;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, MbtiService mbti) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.mbti = mbti;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        users.save(u);
        return new AuthResponse(jwt.generateToken(u), UserDto.from(u));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmailIgnoreCase(req.email().trim())
                .filter(x -> encoder.matches(req.password(), x.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return new AuthResponse(jwt.generateToken(u), UserDto.from(u));
    }

    @Transactional(readOnly = true)
    public User get(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }

    @Transactional
    public UserDto updateProfile(Long id, UpdateProfileRequest req) {
        User u = get(id);
        u.setName(req.name().trim());
        return UserDto.from(users.save(u));
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest req) {
        User u = get(id);
        if (!encoder.matches(req.currentPassword(), u.getPassword())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        u.setPassword(encoder.encode(req.newPassword()));
        users.save(u);
    }

    @Transactional
    public UserDto saveMbtiResult(Long id, MbtiService.Result r) {
        User u = get(id);
        u.setMbtiType(r.type());
        u.setScoreE(r.scoreE());
        u.setScoreN(r.scoreN());
        u.setScoreT(r.scoreT());
        u.setScoreJ(r.scoreJ());
        return UserDto.from(users.save(u));
    }

    /** For users who already know their type: store it with neutral-strength default scores. */
    @Transactional
    public UserDto setMbtiType(Long id, String type) {
        String t = mbti.normalize(type);
        return saveMbtiResult(id, new MbtiService.Result(t,
                t.charAt(0) == 'E' ? 70 : 30,
                t.charAt(1) == 'N' ? 70 : 30,
                t.charAt(2) == 'T' ? 70 : 30,
                t.charAt(3) == 'J' ? 70 : 30));
    }
}
