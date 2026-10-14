package com.personalearn.controller;

import com.personalearn.dto.Dtos.*;
import com.personalearn.security.AuthUser;
import com.personalearn.service.AuthService;
import com.personalearn.service.MbtiService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mbti")
public class MbtiController {

    private final MbtiService mbti;
    private final AuthService auth;

    public MbtiController(MbtiService mbti, AuthService auth) {
        this.mbti = mbti;
        this.auth = auth;
    }

    @GetMapping("/questions")
    public List<MbtiService.Question> questions() {
        return mbti.getQuestions();
    }

    @GetMapping("/types")
    public List<MbtiService.TypeProfile> types() {
        return mbti.allTypes().stream().map(mbti::profile).toList();
    }

    @GetMapping("/types/{type}")
    public MbtiService.TypeProfile type(@PathVariable String type) {
        return mbti.profile(type);
    }

    @PostMapping("/submit")
    public Map<String, Object> submit(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody MbtiSubmitRequest req) {
        MbtiService.Result r = mbti.evaluate(req.answers());
        UserDto u = auth.saveMbtiResult(user.id(), r);
        return Map.of("user", u, "profile", mbti.profile(r.type()));
    }

    @PutMapping("/type")
    public Map<String, Object> setType(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody MbtiManualRequest req) {
        UserDto u = auth.setMbtiType(user.id(), req.type());
        return Map.of("user", u, "profile", mbti.profile(u.mbtiType()));
    }

    @GetMapping("/me")
    public MbtiService.TypeProfile mine(@AuthenticationPrincipal AuthUser user) {
        String t = auth.get(user.id()).getMbtiType();
        return t == null ? null : mbti.profile(t);
    }
}
