import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuFlame, LuClock, LuCircleCheck, LuTrophy, LuPlay } from 'react-icons/lu';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import TypeGlyph from '../components/TypeGlyph';
import AxisBars from '../components/AxisBars';
import CourseCard from '../components/CourseCard';
import ProgressRing from '../components/ProgressRing';
import { FORMAT_LABEL, minutes } from '../lib/mbti';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => setData(data)).catch((e) => setError(errorMessage(e)));
    if (user?.mbtiType) api.get(`/mbti/types/${user.mbtiType}`).then(({ data }) => setProfile(data)).catch(() => {});
  }, [user?.mbtiType]);

  if (error) return <div className="page"><div className="empty"><h2>Your dashboard didn’t load</h2><p>{error}</p></div></div>;
  if (!data) return <div className="page"><div className="skeleton" style={{ height: 220 }} /><div className="skeleton" style={{ height: 300, marginTop: 24 }} /></div>;

  const maxDay = Math.max(1, ...data.weeklyActivity.map((d) => d.lessons));
  const formatTotal = Object.values(data.formatBreakdown).reduce((a, b) => a + b, 0);
  const first = user.name.split(' ')[0];

  return (
    <div className="page dashboard">
      <section className="persona-card">
        <div className="persona-id">
          <p className="muted">{greeting()}, {first}</p>
          {user.mbtiType ? (
            <>
              <TypeGlyph type={user.mbtiType} size="lg" />
              <h1>{profile?.nickname || user.mbtiType}</h1>
              <p className="persona-style">{profile?.learningStyle}</p>
              <Link to="/quiz" className="link-btn">Retake quiz</Link>
            </>
          ) : (
            <>
              <TypeGlyph size="lg" placeholder />
              <h1>Let’s find your learning type</h1>
              <p className="persona-style">Your recommendations get much sharper once we know how you learn.</p>
              <Link to="/quiz" className="btn btn-primary">Take the 2-minute quiz</Link>
            </>
          )}
        </div>
        {user.mbtiType && (
          <div className="persona-axes">
            <AxisBars scores={user} />
          </div>
        )}
      </section>

      <section className="stats">
        <div className="stat"><LuFlame className="stat-ico" style={{ color: 'var(--ax-ei)' }} /><strong>{data.streakDays}</strong><span>day streak</span></div>
        <div className="stat"><LuCircleCheck className="stat-ico" style={{ color: 'var(--ax-sn)' }} /><strong>{data.lessonsCompleted}</strong><span>lessons done</span></div>
        <div className="stat"><LuClock className="stat-ico" style={{ color: 'var(--ax-tf)' }} /><strong>{minutes(data.minutesLearned)}</strong><span>time learning</span></div>
        <div className="stat"><LuTrophy className="stat-ico" style={{ color: 'var(--ax-jp)' }} /><strong>{data.completedCourses}<small>/{data.enrolledCourses}</small></strong><span>courses finished</span></div>
      </section>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Continue learning</h2>
            <Link to="/my-learning" className="link-btn">All my courses</Link>
          </div>
          {data.continueLearning.length === 0 ? (
            <div className="empty small">
              <p>Nothing in progress. Pick a recommended course below to start.</p>
            </div>
          ) : (
            <ul className="continue">
              {data.continueLearning.map((e) => (
                <li key={e.course.id} style={{ '--accent': e.course.color }}>
                  <ProgressRing value={e.progressPercent} size={52} color={e.course.color} />
                  <div className="continue-text">
                    <strong>{e.course.title}</strong>
                    <span>{e.nextLessonTitle ? `Next: ${e.nextLessonTitle}` : 'Ready to review'}</span>
                  </div>
                  <Link to={`/courses/${e.course.id}${e.nextLessonId ? `?lesson=${e.nextLessonId}` : ''}`} className="btn btn-primary btn-sm">
                    <LuPlay /> Resume
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>This week</h2>
          <div className="week" role="img" aria-label="Lessons completed per day this week">
            {data.weeklyActivity.map((d) => (
              <div key={d.date} className="week-col">
                <span className="week-bar" style={{ height: `${(d.lessons / maxDay) * 100}%` }} data-v={d.lessons || ''} />
                <small>{d.label}</small>
              </div>
            ))}
          </div>
          {formatTotal > 0 && (
            <>
              <h3 className="sub">How you’ve been learning</h3>
              <div className="format-bar">
                {Object.entries(data.formatBreakdown).map(([f, n], i) => (
                  <span key={f} style={{ flex: n, background: `var(--f${i % 6})` }} title={`${FORMAT_LABEL[f]}: ${n}`} />
                ))}
              </div>
              <div className="format-legend">
                {Object.entries(data.formatBreakdown).map(([f, n], i) => (
                  <span key={f}><i style={{ background: `var(--f${i % 6})` }} />{FORMAT_LABEL[f]} {n}</span>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="recs">
        <div className="panel-head">
          <div>
            <h2>Recommended for you</h2>
            <p className="muted">Ranked by personality fit, lesson format and your current level.</p>
          </div>
          <Link to="/courses" className="link-btn">Browse all</Link>
        </div>
        <div className="grid-4">
          {data.recommendations.map((r) => (
            <CourseCard key={r.course.id} course={r.course} userType={user.mbtiType} match={r.matchPercent} reasons={r.reasons} />
          ))}
        </div>
        {data.recommendations.length === 0 && <div className="empty small"><p>You’re enrolled in every course. Impressive.</p></div>}
      </section>
    </div>
  );
}
