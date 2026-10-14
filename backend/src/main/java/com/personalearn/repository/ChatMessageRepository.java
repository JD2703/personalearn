package com.personalearn.repository;

import com.personalearn.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserId(Long userId);
}
