package com.personalearn.service;

import com.personalearn.config.ApiException;
import com.personalearn.model.Lesson.Format;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * MBTI assessment and personality-to-learning-style knowledge base.
 *
 * The assessment uses 20 Likert-scale statements (5 per dichotomy). Each statement
 * "leans" towards one pole; agreeing moves the score toward that pole.
 */
@Service
public class MbtiService {

    public record Question(int id, String text, String dimension, char pole) {}

    public record TypeProfile(
            String type,
            String nickname,
            String summary,
            String learningStyle,
            List<String> strengths,
            List<String> challenges,
            List<String> studyTips,
            List<Format> preferredFormats) {}

    public record Result(String type, int scoreE, int scoreN, int scoreT, int scoreJ) {}

    private static final List<Question> QUESTIONS = List.of(
        // E / I
        new Question(1, "I learn best when I can talk ideas through with other people.", "EI", 'E'),
        new Question(2, "I prefer to study alone in a quiet place.", "EI", 'I'),
        new Question(3, "Group projects and study circles energise me.", "EI", 'E'),
        new Question(4, "I like to think things through fully before I share an answer.", "EI", 'I'),
        new Question(5, "I would rather join a live workshop than read a written guide.", "EI", 'E'),
        // S / N
        new Question(6, "I prefer concrete, step-by-step instructions over big-picture theory.", "SN", 'S'),
        new Question(7, "I enjoy exploring how ideas connect, even if they are not immediately practical.", "SN", 'N'),
        new Question(8, "Real-world examples help me more than abstract concepts.", "SN", 'S'),
        new Question(9, "I often imagine new possibilities and 'what if' scenarios while learning.", "SN", 'N'),
        new Question(10, "I trust facts and proven methods more than hunches.", "SN", 'S'),
        // T / F
        new Question(11, "I judge a lesson by how logical and well-reasoned it is.", "TF", 'T'),
        new Question(12, "I learn better when I feel the topic matters to people.", "TF", 'F'),
        new Question(13, "I appreciate blunt, direct feedback on my work.", "TF", 'T'),
        new Question(14, "An encouraging instructor makes a big difference to my motivation.", "TF", 'F'),
        new Question(15, "I enjoy analysing problems objectively, like a puzzle.", "TF", 'T'),
        // J / P
        new Question(16, "I like to follow a clear study schedule with deadlines.", "JP", 'J'),
        new Question(17, "I prefer to jump between topics as my curiosity leads me.", "JP", 'P'),
        new Question(18, "I feel satisfied when I tick items off a checklist.", "JP", 'J'),
        new Question(19, "I do my best work in short bursts close to a deadline.", "JP", 'P'),
        new Question(20, "I like knowing the full course structure before I begin.", "JP", 'J')
    );

    private static final Map<String, String[]> TYPE_TEXT = new LinkedHashMap<>();
    static {
        TYPE_TEXT.put("INTJ", new String[]{"The Architect", "Strategic, independent thinker who loves mastering complex systems and long-term plans."});
        TYPE_TEXT.put("INTP", new String[]{"The Logician", "Curious analyst who enjoys theories, models and understanding how everything works."});
        TYPE_TEXT.put("ENTJ", new String[]{"The Commander", "Decisive, goal-driven learner who turns knowledge into leadership and results."});
        TYPE_TEXT.put("ENTP", new String[]{"The Debater", "Inventive explorer who learns by challenging ideas and experimenting."});
        TYPE_TEXT.put("INFJ", new String[]{"The Advocate", "Insightful, purpose-driven learner who seeks meaning and the bigger picture."});
        TYPE_TEXT.put("INFP", new String[]{"The Mediator", "Imaginative idealist who learns deeply when material aligns with personal values."});
        TYPE_TEXT.put("ENFJ", new String[]{"The Protagonist", "Charismatic collaborator who learns by teaching, mentoring and connecting with others."});
        TYPE_TEXT.put("ENFP", new String[]{"The Campaigner", "Enthusiastic, creative learner who thrives on variety, ideas and people."});
        TYPE_TEXT.put("ISTJ", new String[]{"The Logistician", "Reliable, methodical learner who values structure, accuracy and proven methods."});
        TYPE_TEXT.put("ISFJ", new String[]{"The Defender", "Dedicated, detail-oriented learner who builds solid, practical knowledge to help others."});
        TYPE_TEXT.put("ESTJ", new String[]{"The Executive", "Organised, practical learner who likes clear goals, rules and measurable progress."});
        TYPE_TEXT.put("ESFJ", new String[]{"The Consul", "Supportive, sociable learner who thrives in structured, collaborative environments."});
        TYPE_TEXT.put("ISTP", new String[]{"The Virtuoso", "Hands-on problem solver who learns by taking things apart and building."});
        TYPE_TEXT.put("ISFP", new String[]{"The Adventurer", "Gentle, creative learner who prefers experiential and aesthetic learning."});
        TYPE_TEXT.put("ESTP", new String[]{"The Entrepreneur", "Energetic, action-first learner who learns fastest by doing in real time."});
        TYPE_TEXT.put("ESFP", new String[]{"The Entertainer", "Spontaneous, social learner who loves interactive, lively experiences."});
    }

    public List<Question> getQuestions() {
        return QUESTIONS;
    }

    public List<String> allTypes() {
        return new ArrayList<>(TYPE_TEXT.keySet());
    }

    /**
     * @param answers map of question id -> Likert value (1 = strongly disagree … 5 = strongly agree)
     */
    public Result evaluate(Map<Integer, Integer> answers) {
        if (answers == null || answers.size() < QUESTIONS.size()) {
            throw ApiException.badRequest("Please answer all " + QUESTIONS.size() + " questions");
        }
        Map<String, Integer> raw = new HashMap<>(Map.of("EI", 0, "SN", 0, "TF", 0, "JP", 0));
        Map<String, Integer> counts = new HashMap<>(Map.of("EI", 0, "SN", 0, "TF", 0, "JP", 0));

        for (Question q : QUESTIONS) {
            Integer v = answers.get(q.id());
            if (v == null || v < 1 || v > 5) {
                throw ApiException.badRequest("Invalid or missing answer for question " + q.id());
            }
            int delta = v - 3; // -2..+2
            char primary = q.dimension().charAt(0); // E, S, T, J
            // Score is stored toward E, N, T, J respectively.
            char scoredPole = switch (q.dimension()) {
                case "SN" -> 'N';
                default -> primary;
            };
            raw.merge(q.dimension(), q.pole() == scoredPole ? delta : -delta, Integer::sum);
            counts.merge(q.dimension(), 1, Integer::sum);
        }

        int e = toPercent(raw.get("EI"), counts.get("EI"));
        int n = toPercent(raw.get("SN"), counts.get("SN"));
        int t = toPercent(raw.get("TF"), counts.get("TF"));
        int j = toPercent(raw.get("JP"), counts.get("JP"));

        String type = "" + (e >= 50 ? 'E' : 'I') + (n >= 50 ? 'N' : 'S') + (t >= 50 ? 'T' : 'F') + (j >= 50 ? 'J' : 'P');
        return new Result(type, e, n, t, j);
    }

    private int toPercent(int raw, int count) {
        int max = count * 2;
        return (int) Math.round((raw + max) * 100.0 / (2.0 * max));
    }

    public TypeProfile profile(String type) {
        String t = normalize(type);
        String[] text = TYPE_TEXT.get(t);
        boolean e = t.charAt(0) == 'E', n = t.charAt(1) == 'N', th = t.charAt(2) == 'T', j = t.charAt(3) == 'J';

        List<String> strengths = new ArrayList<>();
        List<String> challenges = new ArrayList<>();
        List<String> tips = new ArrayList<>();
        LinkedHashSet<Format> formats = new LinkedHashSet<>();

        if (e) {
            strengths.add("Learns quickly through discussion and collaboration");
            challenges.add("Long solo reading sessions can feel draining");
            tips.add("Explain what you just learned out loud or to the AI tutor — teaching cements memory.");
            formats.add(Format.DISCUSSION);
            formats.add(Format.INTERACTIVE);
        } else {
            strengths.add("Deep focus and reflective understanding");
            challenges.add("May hesitate to ask questions in group settings");
            tips.add("Block distraction-free time and summarise each lesson in your own notes.");
            formats.add(Format.READING);
        }
        if (n) {
            strengths.add("Sees patterns and connects concepts across topics");
            challenges.add("Can skim over details and fundamentals");
            tips.add("Start each module by skimming the big picture, then come back for the details.");
            formats.add(Format.PROJECT);
        } else {
            strengths.add("Strong grasp of practical, concrete details");
            challenges.add("Abstract theory without examples can feel pointless");
            tips.add("Look for a worked example first, then apply it immediately in practice.");
            formats.add(Format.VIDEO);
            formats.add(Format.QUIZ);
        }
        if (th) {
            strengths.add("Objective, analytical problem solving");
            challenges.add("May lose motivation if the logic of a topic is unclear");
            tips.add("Ask 'why does this work?' and test yourself with quizzes to verify understanding.");
            formats.add(Format.QUIZ);
        } else {
            strengths.add("Connects learning to people and real impact");
            challenges.add("Harsh feedback can be discouraging");
            tips.add("Tie each topic to someone it helps — purpose fuels your motivation.");
            formats.add(Format.DISCUSSION);
        }
        if (j) {
            strengths.add("Organised and consistent with study plans");
            challenges.add("Can feel stressed when plans change");
            tips.add("Set a weekly lesson target and track it on your dashboard.");
        } else {
            strengths.add("Adaptable, curious and open to new directions");
            challenges.add("Procrastination and unfinished courses");
            tips.add("Use short 25-minute sprints and switch formats to keep things fresh.");
            formats.add(Format.INTERACTIVE);
        }

        String style = (e ? "Social" : "Reflective") + ", "
                + (n ? "conceptual" : "practical") + ", "
                + (th ? "logic-driven" : "values-driven") + " learner who prefers "
                + (j ? "structured, planned" : "flexible, exploratory") + " study.";

        return new TypeProfile(t, text[0], text[1], style, strengths, challenges, tips, new ArrayList<>(formats));
    }

    public String normalize(String type) {
        if (type == null) throw ApiException.badRequest("MBTI type is required");
        String t = type.trim().toUpperCase();
        if (!TYPE_TEXT.containsKey(t)) throw ApiException.badRequest("Unknown MBTI type: " + type);
        return t;
    }
}
