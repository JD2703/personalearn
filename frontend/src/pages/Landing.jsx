import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/PublicHeader';
import { AXES, LETTER_COLOR, FORMAT_LABEL } from '../lib/mbti';
import Logo from '../components/Logo';
import CourseCard from '../components/CourseCard';

// Display order of letters in a type: E/I, S/N, T/F, J/P
const PAIRS = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
const AXIS_FOR = [AXES[0], AXES[1], AXES[2], AXES[3]];

export default function Landing() {
  const { user, loading } = useAuth();
  const [pick, setPick] = useState(['I', 'N', 'T', 'J']);
  const [profiles, setProfiles] = useState({});
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/mbti/types').then(({ data }) => setProfiles(Object.fromEntries(data.map((p) => [p.type, p])))).catch(() => {});
    api.get('/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const type = pick.join('');
  const profile = profiles[type];

  const matches = useMemo(() => {
    const score = (c) => c.traits.split('').filter((t) => type.includes(t)).length / Math.max(1, c.traits.length);
    return [...courses].sort((a, b) => score(b) - score(a) || a.id - b.id).slice(0, 3);
  }, [courses, type]);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const flip = (i, letter) => setPick((p) => p.map((x, k) => (k === i ? letter : x)));

  return (
    <div className="landing">
      <PublicHeader />
      <main id="main">

      <section className="hero">
        <div className="hero-copy">
          <h1>Courses that fit the way your mind works.</h1>
          <p className="lead">
            PersonaLearn reads your MBTI personality type, then picks your courses, lesson formats and study pace to match —
            with an AI companion that coaches you like it knows you. Because it does.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">Find my learning type</Link>
            <Link to="/courses" className="btn btn-ghost btn-lg">Browse courses</Link>
          </div>
          <p className="hero-note">Free. Takes about two minutes.</p>
        </div>

        <div className="mixer" aria-label="Try a personality type">
          <p className="mixer-title">Flip the switches to see how each type learns</p>
          <div className="mixer-switches">
            {PAIRS.map(([a, b], i) => (
              <div className="switch" key={a} style={{ '--ax': AXIS_FOR[i].color }} role="radiogroup" aria-label={AXIS_FOR[i].hint}>
                {[a, b].map((l) => (
                  <button
                    key={l}
                    role="radio"
                    aria-checked={pick[i] === l}
                    className={pick[i] === l ? 'on' : ''}
                    onClick={() => flip(i, l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="mixer-result" key={type}>
            <div className="mixer-type">
              {pick.map((l, i) => <span key={i} style={{ color: LETTER_COLOR[l] }}>{l}</span>)}
            </div>
            <h3>{profile?.nickname || '—'}</h3>
            <p>{profile?.summary}</p>
            {profile && (
              <div className="mixer-formats">
                <span>Learns best through</span>
                {profile.preferredFormats.slice(0, 4).map((f) => <em key={f}>{FORMAT_LABEL[f]}</em>)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="land-section">
        <h2>Matched for {type}</h2>
        <p className="section-lead">The same catalogue, re-ranked for whichever type you pick above.</p>
        <div className="grid-3">
          {matches.map((c) => <CourseCard key={c.id} course={c} userType={type} />)}
          {!matches.length && <p className="muted">Courses appear here once the API is running.</p>}
        </div>
      </section>

      <section className="land-section steps">
        <h2>How it works</h2>
        <ol>
          <li>
            <h3>Take the 20-question quiz</h3>
            <p>Rate statements about how you like to learn. You’ll see your type form as you answer.</p>
          </li>
          <li>
            <h3>Get a plan that fits</h3>
            <p>Courses are scored on personality fit, lesson format and your current level — and re-ranked as you progress.</p>
          </li>
          <li>
            <h3>Learn with Persona</h3>
            <p>Your AI companion recommends what’s next, adapts study tips to your type and keeps you going when you stall.</p>
          </li>
        </ol>
      </section>

      </main>
      <footer className="land-foot">
        <Logo />
        <p>Built with React, Spring Boot, JWT and MySQL.</p>
      </footer>
    </div>
  );
}
