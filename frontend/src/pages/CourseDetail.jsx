import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  LuArrowLeft, LuCheck, LuClock, LuLock, LuSparkles, LuFileText, LuVideo, LuMousePointerClick,
  LuUsers, LuHammer, LuListChecks, LuChevronRight, LuRotateCcw,
} from 'react-icons/lu';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProgressRing from '../components/ProgressRing';
import Markdown from '../components/Markdown';
import { TraitChips } from '../components/CourseCard';
import confetti from '../components/confetti';
import { FORMAT_LABEL, LEVEL_LABEL, minutes } from '../lib/mbti';

const FORMAT_ICON = {
  READING: LuFileText, VIDEO: LuVideo, INTERACTIVE: LuMousePointerClick,
  DISCUSSION: LuUsers, PROJECT: LuHammer, QUIZ: LuListChecks,
};

export default function CourseDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preferred, setPreferred] = useState([]);

  const load = useCallback(() =>
    api.get(`/courses/${id}`).then(({ data }) => { setData(data); return data; }).catch((e) => setError(errorMessage(e))), [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user?.mbtiType) api.get(`/mbti/types/${user.mbtiType}`).then(({ data }) => setPreferred(data.preferredFormats)).catch(() => {});
  }, [user?.mbtiType]);

  if (error) return <div className="page"><div className="empty"><h2>Course not available</h2><p>{error}</p><Link to="/courses" className="btn btn-ghost">Back to courses</Link></div></div>;
  if (!data) return <div className="page"><div className="skeleton" style={{ height: 240 }} /></div>;

  const { course, lessons, enrolled, progressPercent } = data;
  const selectedId = Number(params.get('lesson')) || null;
  const selected = enrolled ? lessons.find((l) => l.id === selectedId) || null : null;
  const selIndex = selected ? lessons.indexOf(selected) : -1;

  const select = (lessonId) => {
    setParams(lessonId ? { lesson: String(lessonId) } : {});
    if (window.innerWidth < 900) setTimeout(() => document.getElementById('viewer')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const enroll = async () => {
    if (!user) { navigate('/login', { state: { from: `/courses/${id}` } }); return; }
    setBusy(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      const d = await load();
      toast(`Enrolled in ${course.title}`);
      if (d?.nextLessonId) select(d.nextLessonId);
    } catch (e) { toast(errorMessage(e), 'error'); } finally { setBusy(false); }
  };

  const unenroll = async () => {
    if (!window.confirm('Leave this course? Your progress stays saved if you re-enrol.')) return;
    await api.delete(`/courses/${id}/enroll`);
    setParams({});
    await load();
    toast('Left the course');
  };

  const toggleComplete = async (lesson) => {
    setBusy(true);
    try {
      const { data: e } = lesson.completed
        ? await api.delete(`/lessons/${lesson.id}/complete`)
        : await api.put(`/lessons/${lesson.id}/complete`);
      await load();
      if (!lesson.completed) {
        if (e.progressPercent === 100) {
          confetti();
          toast(`Course complete: ${course.title}`);
        } else if (e.nextLessonId) {
          select(e.nextLessonId);
        }
      }
    } catch (err) { toast(errorMessage(err), 'error'); } finally { setBusy(false); }
  };

  const totalMin = lessons.reduce((a, l) => a + l.durationMinutes, 0);

  return (
    <div className="page course-page" style={{ '--accent': course.color }}>
      <Link to="/courses" className="link-btn"><LuArrowLeft /> All courses</Link>

      <header className="course-hero">
        <div className="course-hero-text">
          <div className="course-hero-meta">
            <span className="course-cat">{course.category}</span>
            <span className={`level level-${course.level.toLowerCase()}`}>{LEVEL_LABEL[course.level]}</span>
            <TraitChips traits={course.traits} userType={user?.mbtiType} />
          </div>
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
          <p className="muted">
            {course.instructor && <>With {course.instructor} · </>}{lessons.length} lessons · {minutes(totalMin)}
          </p>
          <div className="course-hero-cta">
            {enrolled ? (
              <>
                {data.nextLessonId
                  ? <button className="btn btn-primary btn-lg" onClick={() => select(data.nextLessonId)}>{progressPercent ? 'Continue' : 'Start first lesson'}</button>
                  : <span className="done-badge"><LuCheck /> Completed</span>}
                <button className="btn btn-ghost" onClick={unenroll}>Leave course</button>
              </>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={enroll} disabled={busy}>{user ? 'Enrol for free' : 'Log in to enrol'}</button>
            )}
          </div>
        </div>
        {enrolled && <ProgressRing value={progressPercent} size={120} stroke={10} color={course.color} />}
      </header>

      {data.personalizedTip && (
        <div className="tip-box">
          <LuSparkles aria-hidden="true" />
          <p>{data.personalizedTip}</p>
        </div>
      )}

      <div className="course-layout">
        <ol className="lesson-list">
          {lessons.map((l, i) => {
            const Icon = FORMAT_ICON[l.format];
            const fits = preferred.includes(l.format);
            return (
              <li key={l.id}>
                <button
                  className={`lesson-row ${selected?.id === l.id ? 'active' : ''} ${l.completed ? 'completed' : ''}`}
                  onClick={() => (enrolled ? select(l.id) : enroll())}
                  aria-current={selected?.id === l.id ? 'true' : undefined}
                >
                  <span className="lesson-num">{l.completed ? <LuCheck /> : i + 1}</span>
                  <span className="lesson-info">
                    <strong>{l.title}</strong>
                    <small>
                      <Icon aria-hidden="true" /> {FORMAT_LABEL[l.format]} · {l.durationMinutes} min
                      {fits && <em className="fit-tag">Your style</em>}
                    </small>
                  </span>
                  {enrolled ? <LuChevronRight className="chev" /> : <LuLock className="chev" />}
                </button>
              </li>
            );
          })}
        </ol>

        <article className="viewer" id="viewer">
          {!enrolled ? (
            <div className="viewer-empty">
              <LuLock />
              <h2>Enrol to open the lessons</h2>
              <p>Your progress, streak and recommendations update as you complete each one.</p>
              <button className="btn btn-primary" onClick={enroll} disabled={busy}>{user ? 'Enrol for free' : 'Log in to enrol'}</button>
            </div>
          ) : !selected ? (
            <div className="viewer-empty">
              <ProgressRing value={progressPercent} size={84} stroke={8} color={course.color} />
              <h2>{progressPercent === 100 ? 'You finished this course' : 'Pick a lesson to begin'}</h2>
              <p>{progressPercent === 100 ? 'Review any lesson, or find your next course on the dashboard.' : 'Lessons that suit your learning style are tagged in the list.'}</p>
              {progressPercent === 100 && <Link to="/dashboard" className="btn btn-primary">Find my next course</Link>}
            </div>
          ) : (
            <>
              <header className="viewer-head">
                <span className="viewer-format">
                  {(() => { const Icon = FORMAT_ICON[selected.format]; return <Icon aria-hidden="true" />; })()}
                  {FORMAT_LABEL[selected.format]} · <LuClock aria-hidden="true" /> {selected.durationMinutes} min
                </span>
                <span className="muted">Lesson {selIndex + 1} of {lessons.length}</span>
              </header>
              <h2>{selected.title}</h2>
              <Markdown text={selected.content || ''} />
              <footer className="viewer-foot">
                <button className="link-btn" disabled={selIndex <= 0} onClick={() => select(lessons[selIndex - 1].id)}>
                  <LuArrowLeft /> Previous
                </button>
                <div className="viewer-actions">
                  {selected.completed ? (
                    <>
                      <span className="done-badge"><LuCheck /> Completed</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleComplete(selected)} disabled={busy}><LuRotateCcw /> Undo</button>
                      {selIndex < lessons.length - 1 && <button className="btn btn-primary" onClick={() => select(lessons[selIndex + 1].id)}>Next lesson</button>}
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={() => toggleComplete(selected)} disabled={busy}><LuCheck /> Mark complete</button>
                  )}
                </div>
              </footer>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
