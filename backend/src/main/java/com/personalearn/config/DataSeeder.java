package com.personalearn.config;

import com.personalearn.model.Course;
import com.personalearn.model.Lesson;
import com.personalearn.model.Lesson.Format;
import com.personalearn.model.User;
import com.personalearn.repository.CourseRepository;
import com.personalearn.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds a demo admin, a demo student and a catalogue of courses on first start. */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final CourseRepository courses;
    private final PasswordEncoder encoder;
    private final boolean enabled;

    public DataSeeder(UserRepository users, CourseRepository courses, PasswordEncoder encoder,
                      @Value("${app.seed.enabled:true}") boolean enabled) {
        this.users = users;
        this.courses = courses;
        this.encoder = encoder;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        if (!users.existsByEmailIgnoreCase("admin@personalearn.com")) {
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail("admin@personalearn.com");
            admin.setPassword(encoder.encode("admin123"));
            admin.setRole(User.Role.ADMIN);
            users.save(admin);
        }
        if (!users.existsByEmailIgnoreCase("demo@personalearn.com")) {
            User demo = new User();
            demo.setName("Demo Learner");
            demo.setEmail("demo@personalearn.com");
            demo.setPassword(encoder.encode("demo123"));
            demo.setMbtiType("INTJ");
            demo.setScoreE(28);
            demo.setScoreN(76);
            demo.setScoreT(70);
            demo.setScoreJ(64);
            users.save(demo);
        }
        if (courses.count() > 0) return;

        course("Java Fundamentals", "Programming", Course.Level.BEGINNER, "ISTJ", "#e8590c", "Priya Raman",
                "Build a rock-solid foundation in Java: syntax, types, control flow, OOP and collections — with structured, step-by-step practice.",
                l("Why Java? The JVM in 10 minutes", Format.VIDEO, 10, """
                        Java code compiles to **bytecode**, which runs on the Java Virtual Machine (JVM). That's why the same program runs on Windows, macOS and Linux.

                        Key ideas:
                        - `javac` compiles `.java` files into `.class` bytecode
                        - The JVM loads, verifies and executes the bytecode
                        - The JIT compiler turns hot code paths into native machine code for speed
                        """),
                l("Variables, types and operators", Format.READING, 15, """
                        Java is **statically typed** — every variable has a type known at compile time.

                        ```java
                        int age = 21;
                        double gpa = 8.7;
                        boolean enrolled = true;
                        String name = "Asha";
                        ```

                        Primitives (`int`, `double`, `boolean`, `char`, `long`…) hold values directly; objects like `String` are references.
                        """),
                l("Control flow drills", Format.QUIZ, 15, """
                        Practise `if/else`, `switch`, `for`, `while` and enhanced `for` loops.

                        Challenge: print FizzBuzz for 1–30. Then rewrite it using a `switch` expression on `i % 15`.
                        """),
                l("Classes, objects and encapsulation", Format.READING, 20, """
                        A **class** is a blueprint; an **object** is an instance. Encapsulation means keeping fields `private` and exposing behaviour via methods.

                        ```java
                        public class Student {
                            private final String name;
                            private int xp;
                            public Student(String name) { this.name = name; }
                            public void earn(int points) { xp += points; }
                        }
                        ```
                        """),
                l("Collections: List, Set, Map", Format.INTERACTIVE, 20, """
                        - `List` — ordered, allows duplicates (`ArrayList`)
                        - `Set` — unique elements (`HashSet`, `TreeSet`)
                        - `Map` — key → value (`HashMap`)

                        Try it: count word frequencies in a sentence using a `HashMap<String, Integer>` and `merge()`.
                        """),
                l("Mini project: Grade book", Format.PROJECT, 40, """
                        Build a console grade book that stores students and scores, computes averages, and prints a ranked report.
                        Use a `Map<String, List<Integer>>` and sort with `Comparator`.
                        """));

        course("Spring Boot REST APIs", "Programming", Course.Level.INTERMEDIATE, "NTJ", "#2f9e44", "Arjun Mehta",
                "Design and build production-style REST APIs with Spring Boot, JPA, validation and JWT security.",
                l("Spring Boot architecture", Format.VIDEO, 12, """
                        Spring Boot builds on Spring's **dependency injection** container with auto-configuration and embedded servers.
                        A typical app has layers: **Controller → Service → Repository → Database**.
                        """),
                l("Your first REST controller", Format.INTERACTIVE, 20, """
                        ```java
                        @RestController
                        @RequestMapping("/api/courses")
                        class CourseController {
                            @GetMapping List<Course> all() { return repo.findAll(); }
                        }
                        ```
                        Return objects and Jackson serialises them to JSON automatically.
                        """),
                l("Persistence with Spring Data JPA", Format.READING, 20, """
                        Annotate entities with `@Entity`, extend `JpaRepository<Entity, Id>`, and get CRUD for free.
                        Derived queries like `findByEmailIgnoreCase(String email)` are generated from method names.
                        """),
                l("Securing APIs with JWT", Format.READING, 25, """
                        A **JSON Web Token** has a header, payload (claims) and signature. The server signs it at login; clients send `Authorization: Bearer <token>`.
                        A filter validates the signature on every request — no server-side session needed (stateless).
                        """),
                l("Design review: API best practices", Format.DISCUSSION, 15, """
                        Discuss: resource naming, status codes (201 vs 200), pagination, error formats and versioning. What would you change in your last API?
                        """),
                l("Project: Course catalogue API", Format.PROJECT, 60, """
                        Build a CRUD API for courses and lessons with validation, a global exception handler and JWT-protected admin routes.
                        """));

        course("React for Beginners", "Web Development", Course.Level.BEGINNER, "ENP", "#1c7ed6", "Neha Kapoor",
                "Learn React by building: components, props, state, hooks and routing — with lots of hands-on, interactive exercises.",
                l("Thinking in components", Format.VIDEO, 12, """
                        A React UI is a tree of **components** — functions that return JSX. Break a page into small reusable pieces: `Navbar`, `CourseCard`, `ProgressBar`.
                        """),
                l("JSX and props", Format.INTERACTIVE, 15, """
                        ```jsx
                        function CourseCard({ title, progress }) {
                          return <div className="card"><h3>{title}</h3><p>{progress}%</p></div>;
                        }
                        ```
                        Props flow **down** from parent to child.
                        """),
                l("State with useState", Format.INTERACTIVE, 20, """
                        `const [count, setCount] = useState(0);` — calling `setCount` re-renders the component.
                        Build a like button that toggles and counts.
                        """),
                l("Side effects with useEffect", Format.READING, 15, """
                        Fetch data after render: `useEffect(() => { api.get('/courses').then(setCourses); }, []);`
                        The dependency array controls when the effect re-runs.
                        """),
                l("Pair-build: a todo app", Format.DISCUSSION, 20, """
                        Work with a partner (or the AI tutor): one person drives, one navigates. Swap every 10 minutes.
                        """),
                l("Project: Personal portfolio", Format.PROJECT, 45, """
                        Build a multi-page portfolio with React Router, a projects grid and a contact form with validation.
                        """));

        course("SQL & MySQL Essentials", "Data", Course.Level.BEGINNER, "STJ", "#0c8599", "Rahul Iyer",
                "Query, design and optimise relational databases with MySQL — from SELECT to joins, indexes and normalisation.",
                l("Relational thinking", Format.READING, 12, """
                        Data lives in **tables** of rows and columns. Relationships are expressed with **primary keys** and **foreign keys**.
                        """),
                l("SELECT, WHERE, ORDER BY", Format.INTERACTIVE, 15, """
                        ```sql
                        SELECT name, email FROM users WHERE mbti_type = 'INTJ' ORDER BY created_at DESC;
                        ```
                        """),
                l("Joins demystified", Format.VIDEO, 18, """
                        `INNER JOIN` keeps matching rows; `LEFT JOIN` keeps everything from the left table. Join enrollments to courses to list each learner's courses.
                        """),
                l("Aggregation drills", Format.QUIZ, 15, """
                        Use `COUNT`, `AVG`, `GROUP BY` and `HAVING`. Challenge: find courses with more than 10 enrolments.
                        """),
                l("Indexes and normalisation", Format.READING, 20, """
                        Indexes speed up lookups at the cost of slower writes. Normalise to 3NF to remove redundancy; denormalise deliberately for read performance.
                        """));

        course("Data Structures & Algorithms", "Computer Science", Course.Level.INTERMEDIATE, "INT", "#7048e8", "Dr. Kavya Nair",
                "Master the patterns behind technical interviews: complexity, arrays, trees, graphs and dynamic programming.",
                l("Big-O intuition", Format.READING, 15, """
                        Big-O describes how runtime grows with input size. O(1) constant, O(log n) binary search, O(n) linear scan, O(n log n) good sorts, O(n²) nested loops.
                        """),
                l("Two pointers & sliding window", Format.INTERACTIVE, 25, """
                        Solve "longest substring without repeating characters" with a sliding window and a `Set`. Aim for O(n).
                        """),
                l("Trees and recursion", Format.VIDEO, 20, """
                        A binary tree node has a value and two children. Most tree problems are recursion: solve for left, solve for right, combine.
                        """),
                l("Graphs: BFS and DFS", Format.READING, 25, """
                        BFS uses a queue and finds shortest paths in unweighted graphs. DFS uses a stack (or recursion) and is great for connectivity and cycle detection.
                        """),
                l("Dynamic programming puzzles", Format.QUIZ, 30, """
                        Identify overlapping subproblems. Practise: climbing stairs, coin change, longest common subsequence.
                        """),
                l("Project: Course prerequisite planner", Format.PROJECT, 45, """
                        Model courses as a directed graph and use topological sort to produce a valid study order.
                        """));

        course("UI/UX Design Foundations", "Design", Course.Level.BEGINNER, "NFP", "#d6336c", "Meera Joshi",
                "Design interfaces people love: user research, information architecture, visual hierarchy and prototyping.",
                l("Design is empathy", Format.DISCUSSION, 15, """
                        Great design starts with people. Interview a friend about an app they find frustrating — what job were they trying to do?
                        """),
                l("Visual hierarchy & typography", Format.VIDEO, 15, """
                        Size, weight, colour and spacing guide the eye. Limit yourself to two typefaces and a clear type scale.
                        """),
                l("Colour and accessibility", Format.READING, 15, """
                        Aim for WCAG AA contrast (4.5:1 for body text). Never rely on colour alone to convey meaning.
                        """),
                l("Wireframe sprint", Format.INTERACTIVE, 20, """
                        Sketch 6 variations of a course dashboard in 6 minutes (Crazy 8s style). Pick the strongest and refine it.
                        """),
                l("Project: Redesign a learning app screen", Format.PROJECT, 40, """
                        Choose one screen from an app you use. Research, wireframe, prototype and present your redesign with rationale.
                        """));

        course("Public Speaking & Communication", "Soft Skills", Course.Level.BEGINNER, "EF", "#f59f00", "Karthik Subramanian",
                "Speak with confidence: structure a talk, tell stories, handle nerves and engage any audience.",
                l("Why your voice matters", Format.VIDEO, 10, """
                        Communication multiplies every other skill you have. Great speakers aren't born — they rehearse.
                        """),
                l("Structure: hook, message, call to action", Format.READING, 12, """
                        Open with a hook (story, question, surprising fact), deliver one core message with three supports, end with a clear call to action.
                        """),
                l("Storytelling workshop", Format.DISCUSSION, 20, """
                        Share a 60-second story about a time you learned something the hard way. Get feedback on clarity and emotion.
                        """),
                l("Managing stage nerves", Format.INTERACTIVE, 15, """
                        Box breathing (4-4-4-4), power posture and rehearsing the first 30 seconds until automatic.
                        """),
                l("Project: 3-minute talk", Format.PROJECT, 30, """
                        Record a 3-minute talk on a topic you love. Watch it back and note three things to improve.
                        """));

        course("Machine Learning Concepts", "Data", Course.Level.ADVANCED, "INTJ", "#495057", "Dr. Sanjay Rao",
                "Understand how machine learning works under the hood: models, training, evaluation and responsible AI.",
                l("What is learning?", Format.READING, 15, """
                        ML finds patterns in data to make predictions. **Supervised** learning uses labelled examples; **unsupervised** finds structure without labels.
                        """),
                l("Linear regression from scratch", Format.INTERACTIVE, 30, """
                        Minimise mean squared error with gradient descent. Watch the loss curve fall as the line fits the points.
                        """),
                l("Overfitting and validation", Format.VIDEO, 20, """
                        A model that memorises training data fails on new data. Use train/validation/test splits and cross-validation.
                        """),
                l("Evaluation metrics quiz", Format.QUIZ, 15, """
                        Accuracy, precision, recall, F1, ROC-AUC — which would you use for fraud detection, and why?
                        """),
                l("Project: Predict course completion", Format.PROJECT, 60, """
                        Using learner activity features, train a classifier to predict who will complete a course. Discuss fairness risks.
                        """));

        course("Team Collaboration & Leadership", "Soft Skills", Course.Level.INTERMEDIATE, "EFJ", "#12b886", "Ananya Krishnan",
                "Lead and collaborate effectively: feedback, conflict resolution, facilitation and personality-aware teamwork.",
                l("Personality types in teams", Format.READING, 15, """
                        Mixed teams outperform when differences are understood. Introverts may need time to reflect; Perceivers bring flexibility; Thinkers stress-test ideas.
                        """),
                l("Giving and receiving feedback", Format.DISCUSSION, 20, """
                        Use SBI: Situation, Behaviour, Impact. Role-play giving feedback to a teammate who missed a deadline.
                        """),
                l("Running great meetings", Format.VIDEO, 15, """
                        Every meeting needs a purpose, an agenda, a facilitator and written outcomes. Default to 25 minutes.
                        """),
                l("Conflict resolution scenarios", Format.INTERACTIVE, 20, """
                        Work through three scenarios and choose a response. See how each choice affects trust and outcomes.
                        """),
                l("Project: Team charter", Format.PROJECT, 30, """
                        Draft a team charter: goals, roles, communication norms and how decisions get made.
                        """));

        course("Creative Problem Solving", "Soft Skills", Course.Level.BEGINNER, "NP", "#ae3ec9", "Vikram Desai",
                "Generate better ideas with design thinking, lateral thinking and rapid experimentation.",
                l("Divergent vs convergent thinking", Format.READING, 12, """
                        First go wide (generate many ideas without judging), then go narrow (evaluate and choose). Mixing the two kills creativity.
                        """),
                l("SCAMPER challenge", Format.INTERACTIVE, 20, """
                        Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse — apply each to a backpack.
                        """),
                l("Brainstorm jam", Format.DISCUSSION, 20, """
                        Aim for quantity: 30 ideas in 10 minutes for making studying more fun. Build on others' ideas with "yes, and…".
                        """),
                l("Project: Prototype a solution", Format.PROJECT, 35, """
                        Pick your best idea, build a paper or digital prototype, test it with two people and iterate once.
                        """));

        course("Advanced React Patterns", "Web Development", Course.Level.ADVANCED, "NT", "#364fc7", "Neha Kapoor",
                "Level up your React: custom hooks, context, performance, code-splitting and scalable architecture.",
                l("Custom hooks", Format.READING, 20, """
                        Extract reusable stateful logic: `useFetch`, `useLocalStorage`, `useDebounce`. Hooks compose like functions.
                        """),
                l("Context and global state", Format.VIDEO, 18, """
                        Use Context for auth and theme. Avoid putting rapidly changing values in context — it re-renders all consumers.
                        """),
                l("Performance profiling", Format.INTERACTIVE, 25, """
                        Use React DevTools Profiler. Apply `memo`, `useMemo`, `useCallback` only where measurements show a win.
                        """),
                l("Architecture review", Format.DISCUSSION, 20, """
                        Feature folders vs layer folders — debate the trade-offs for a 50-screen app.
                        """),
                l("Project: Build a dashboard", Format.PROJECT, 60, """
                        Build an analytics dashboard with lazy-loaded routes, a custom data hook and memoised charts.
                        """));

        log.info("Seeded {} courses", courses.count());
    }

    private record L(String title, Format format, int minutes, String content) {}

    private static L l(String title, Format format, int minutes, String content) {
        return new L(title, format, minutes, content.strip());
    }

    private void course(String title, String category, Course.Level level, String traits, String color,
                        String instructor, String description, L... lessons) {
        Course c = new Course();
        c.setTitle(title);
        c.setCategory(category);
        c.setLevel(level);
        c.setTraits(traits);
        c.setColor(color);
        c.setInstructor(instructor);
        c.setDescription(description);
        int i = 1;
        for (L x : lessons) {
            Lesson lesson = new Lesson();
            lesson.setTitle(x.title());
            lesson.setFormat(x.format());
            lesson.setDurationMinutes(x.minutes());
            lesson.setContent(x.content());
            lesson.setOrderIndex(i++);
            c.addLesson(lesson);
        }
        courses.save(c);
    }
}
