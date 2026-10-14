package com.personalearn.controller;

import com.personalearn.dto.Dtos.*;
import com.personalearn.security.AuthUser;
import com.personalearn.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatbotService chat;

    public ChatController(ChatbotService chat) {
        this.chat = chat;
    }

    @GetMapping
    public List<ChatMessageDto> history(@AuthenticationPrincipal AuthUser user) {
        return chat.history(user.id());
    }

    @PostMapping
    public ChatMessageDto send(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody ChatRequest req) {
        return chat.chat(user.id(), req.message());
    }

    @DeleteMapping
    public Map<String, String> clear(@AuthenticationPrincipal AuthUser user) {
        chat.clear(user.id());
        return Map.of("message", "Chat cleared");
    }
}
