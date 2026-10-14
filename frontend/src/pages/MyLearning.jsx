import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPlay, LuCheck } from 'react-icons/lu';
import api, { errorMessage } from '../api';
import ProgressRing from '../components/ProgressRing';

export default function MyLearning() {
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('active');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/my/courses').then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e)));
  }, []);

  const active = (items || []).filter((e) => !e.completedAt);
  const done = (items || []).filter((e) => e.completedAt);
  const shown = tab === 'active' ? active : done;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My learning</h1>
          <p className="muted">Everything you’re enrolled in, most recent first.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'active'} className={tab === 'active' ? 'on' : ''} onClick={() => setTab('active')}>In progress <span>{active.length}</span></button>
        <button role="tab" aria-selected={tab === 'done'} className={tab === 'done' ? 'on' : ''} onClick={() => setTab('done')}>Completed <span>{done.length}</span></button>
      </div>

      {error && <div className="empty"><p>{error}</p></div>}
      {!items && !error && <div className="skeleton" style={{ height: 200 }} />}
      {items && shown.length === 0 && (
        <div className="empty">
          <h2>{tab === 'active' ? 'No courses in progress' : 'No finished courses yet'}</h2>
          <p>{tab === 'active' ? 'Your recommended courses are a good place to start.' : 'Complete every lesson in a course and it moves here.'}</p>
          <Link to={tab === 'active' ? '/dashboard' : '/my-learning'} className="btn btn-primary" onClick={() => tab === 'done' && setTab('active')}>
            {tab === 'active' ? 'See recommendations' : 'Back to in progress'}
          </Link>
        </div>
      )}
      <ul className="learning-list">
        {shown.map((e) => (
          <li key={e.course.id} style={{ '--accent': e.course.color }}>
            <ProgressRing value={e.progressPercent} size={64} stroke={7} color={e.course.color} />
            <div className="learning-text">
              <span className="course-cat">{e.course.category}</span>
              <h3>{e.course.title}</h3>
              <p className="muted">
                {e.completedLessons} of {e.course.lessonCount} lessons
                {e.nextLessonTitle && <> · Next: {e.nextLessonTitle}</>}
                {e.completedAt && <> · Finished {new Date(e.completedAt).toLocaleDateString()}</>}
              </p>
            </div>
            <Link to={`/courses/${e.course.id}${e.nextLessonId ? `?lesson=${e.nextLessonId}` : ''}`} className={`btn ${e.completedAt ? 'btn-ghost' : 'btn-primary'}`}>
              {e.completedAt ? <><LuCheck /> Review</> : <><LuPlay /> Resume</>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
