package com.personalearn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ApiFlowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void fullLearnerJourney() throws Exception {
        // Public catalogue
        mvc.perform(get("/api/courses")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(11));
        mvc.perform(get("/api/mbti/questions")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(20));

        // Protected without token
        mvc.perform(get("/api/dashboard")).andExpect(status().isUnauthorized());

        // Register
        String body = json.writeValueAsString(Map.of("name", "Test User", "email", "test@example.com", "password", "secret12"));
        String res = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String token = json.readTree(res).get("token").asText();
        String auth = "Bearer " + token;

        // Duplicate email
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());

        // MBTI: agree with every E, N, T, J statement, disagree with the rest -> ENTJ
        JsonNode questions = json.readTree(mvc.perform(get("/api/mbti/questions")).andReturn().getResponse().getContentAsString());
        Map<Integer, Integer> answers = new HashMap<>();
        for (JsonNode q : questions) {
            String pole = q.get("pole").asText();
            answers.put(q.get("id").asInt(), "ENTJ".contains(pole) ? 5 : 1);
        }
        mvc.perform(post("/api/mbti/submit").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("answers", answers))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.mbtiType").value("ENTJ"))
                .andExpect(jsonPath("$.profile.nickname").value("The Commander"));

        // Dashboard with recommendations
        mvc.perform(get("/api/dashboard").header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendations.length()").value(4));

        // Enrol and complete a lesson
        mvc.perform(post("/api/courses/1/enroll").header("Authorization", auth)).andExpect(status().isOk());
        String detail = mvc.perform(get("/api/courses/1").header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.enrolled").value(true))
                .andReturn().getResponse().getContentAsString();
        long lessonId = json.readTree(detail).get("lessons").get(0).get("id").asLong();
        mvc.perform(put("/api/lessons/" + lessonId + "/complete").header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completedLessons").value(1));

        // Chatbot
        String chat = mvc.perform(post("/api/chat").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"How am I doing?\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(chat).get("content").asText()).contains("1 lessons completed");

        // Students cannot use admin API
        mvc.perform(get("/api/admin/stats").header("Authorization", auth)).andExpect(status().isForbidden());

        // Admin can
        String adminRes = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@personalearn.com\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String adminAuth = "Bearer " + json.readTree(adminRes).get("token").asText();
        mvc.perform(get("/api/admin/stats").header("Authorization", adminAuth)).andExpect(status().isOk());
        mvc.perform(delete("/api/admin/courses/1").header("Authorization", adminAuth)).andExpect(status().isOk());
    }
}
