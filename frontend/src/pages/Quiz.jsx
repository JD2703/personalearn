import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AXES, FORMAT_LABEL } from '../lib/mbti';
import TypeGlyph from '../components/TypeGlyph';
import AxisBars from '../components/AxisBars';
import confetti from '../components/confetti';

const SCALE = [
  { v: 1, label: 'Strongly disagree' },
  { v: 2, label: 'Disagree' },
  { v: 3, label: 'Neutral' },
  { v: 4, label: 'Agree' },
  { v: 5, label: 'Strongly agree' },
];
const SCORED_POLE = { EI: 'E', SN: 'N', TF: 'T', JP: 'J' };
const DIM_AXIS = { EI: AXES[0], SN: AXES[1], TF: AXES[2], JP: AXES[3] };

/** Live preview of the type while answering, using the same scoring as the server. */
function liveType(questions, answers) {
  const sums = { EI: 0, SN: 0, TF: 0, JP: 0 }, counts = { EI: 0, SN: 0, TF: 0, JP: 0 };
  questions.forEach((q) => {
    const v = answers[q.id];
    if (!v) return;
    const d = v - 3;
    sums[q.dimension] += q.pole === SCORED_POLE[q.dimension] ? d : -d;
    counts[q.dimension]++;
  });
  const letter = (dim, a, b) => (counts[dim] === 0 ? '?' : sums[dim] >= 0 ? a : b);
  return letter('EI', 'E', 'I') + letter('SN', 'N', 'S') + letter('TF', 'T', 'F') + letter('JP', 'J', 'P');
}

export default function Quiz() {
  const { setUser, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualPick, setManualPick] = useState(['I', 'N', 'T', 'J']);

  useEffect(() => {
    api.get('/mbti/questions').then(({ data }) => setQuestions(data)).catch((e) => toast(errorMessage(e), 'error'));
  }, [toast]);

  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const preview = useMemo(() => liveType(questions, answers), [questions, answers]);

  const finish = useCallback(async (all) => {
    setBusy(true);
    try {
      const { data } = await api.post('/mbti/submit', { answers: all });
      setUser(data.user);
      setResult(data);
      setTimeout(confetti, 350);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }, [setUser, toast]);

  const choose = useCallback((v) => {
    if (!q || busy) return;
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    if (index < questions.length - 1) {
      setTimeout(() => setIndex((i) => i + 1), 220);
    } else if (Object.keys(next).length === questions.length) {
      finish(next);
    }
  }, [q, busy, answers, index, questions.length, finish]);

  useEffect(() => {
    if (result || manual) return;
    const onKey = (e) => {
      if (['1', '2', '3', '4', '5'].includes(e.key)) choose(Number(e.key));
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, index, result, manual]);

  const saveManual = async () => {
    setBusy(true);
    try {
      const { data } = await api.put('/mbti/type', { type: manualPick.join('') });
      setUser(data.user);
      setResult(data);
      setTimeout(confetti, 350);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const p = result.profile;
    return (
      <div className="page quiz-result">
        <div className="result-hero">
          <TypeGlyph type={p.type} size="xl" animate />
          <div>
            <p className="muted">You’re an {p.type}</p>
            <h1>{p.nickname}</h1>
            <p className="lead">{p.summary}</p>
          </div>
        </div>
        <div className="result-grid">
          <section className="panel">
            <h2>Your preferences</h2>
            <AxisBars scores={result.user} />
          </section>
          <section className="panel">
            <h2>How you learn</h2>
            <p>{p.learningStyle}</p>
            <h3>Formats we’ll prioritise for you</h3>
            <div className="format-chips">{p.preferredFormats.map((f) => <span key={f} className="chip static">{FORMAT_LABEL[f]}</span>)}</div>
          </section>
          <section className="panel">
            <h2>Strengths</h2>
            <ul className="tick-list">{p.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
          <section className="panel">
            <h2>Watch out for</h2>
            <ul className="dot-list">{p.challenges.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
          <section className="panel span-2">
            <h2>Study tips for {p.type}</h2>
            <ul className="tips">{p.studyTips.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        </div>
        <div className="result-cta">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>See my recommended courses</button>
          <button className="btn btn-ghost btn-lg" onClick={() => { setResult(null); setAnswers({}); setIndex(0); setManual(false); }}>Retake quiz</button>
        </div>
      </div>
    );
  }

  if (manual) {
    const pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
    return (
      <div className="page quiz">
        <button className="link-btn" onClick={() => setManual(false)}><LuArrowLeft /> Back to the quiz</button>
        <h1>Pick your type</h1>
        <p className="muted">Already took an MBTI assessment? Choose one letter from each pair.</p>
        <div className="manual-pick">
          {pairs.map(([a, b], i) => (
            <div className="switch big" key={a} style={{ '--ax': AXES[i].color }} role="radiogroup" aria-label={AXES[i].hint}>
              {[a, b].map((l) => (
                <button key={l} role="radio" aria-checked={manualPick[i] === l} className={manualPick[i] === l ? 'on' : ''}
                  onClick={() => setManualPick((p) => p.map((x, k) => (k === i ? l : x)))}>{l}</button>
              ))}
              <small>{AXES[i].hint}</small>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" onClick={saveManual} disabled={busy}>Save {manualPick.join('')}</button>
      </div>
    );
  }

  return (
    <div className="page quiz">
      <div className="quiz-head">
        <div>
          <h1>{user?.mbtiType ? 'Retake the personality quiz' : 'Find your learning type'}</h1>
          <p className="muted">Answer honestly — there are no right answers. Use keys 1–5 to go faster.</p>
        </div>
        <div className="quiz-live" aria-live="polite">
          <small>Your type so far</small>
          <TypeGlyph type={preview} size="md" />
        </div>
      </div>

      <div className="quiz-progress" aria-label={`${answeredCount} of ${questions.length} answered`}>
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            className={`qdot ${answers[qq.id] ? 'done' : ''} ${i === index ? 'current' : ''}`}
            style={{ '--ax': DIM_AXIS[qq.dimension].color }}
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>

      {q ? (
        <div className="qcard" key={q.id} style={{ '--ax': DIM_AXIS[q.dimension].color }}>
          <span className="qnum">Question {index + 1} of {questions.length} · {DIM_AXIS[q.dimension].hint}</span>
          <p className="qtext">{q.text}</p>
          <div className="likert" role="radiogroup" aria-label="Your answer">
            <span className="likert-end">Disagree</span>
            {SCALE.map((s) => (
              <button
                key={s.v}
                role="radio"
                aria-checked={answers[q.id] === s.v}
                aria-label={s.label}
                title={s.label}
                className={`lk lk-${s.v} ${answers[q.id] === s.v ? 'on' : ''}`}
                onClick={() => choose(s.v)}
              />
            ))}
            <span className="likert-end">Agree</span>
          </div>
          <div className="qnav">
            <button className="link-btn" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}><LuArrowLeft /> Previous</button>
            {busy && <span className="muted">Working out your type…</span>}
            {answeredCount === questions.length && !busy && (
              <button className="btn btn-primary" onClick={() => finish(answers)}>See my results</button>
            )}
          </div>
        </div>
      ) : (
        <div className="qcard skeleton" style={{ height: 260 }} />
      )}

      <p className="quiz-alt">
        Already know your type? <button className="link-btn inline" onClick={() => setManual(true)}>Enter it directly</button>
        {user?.mbtiType && <> · <Link to="/dashboard">Back to dashboard</Link></>}
      </p>
    </div>
  );
}
