import { Link } from 'react-router-dom';
import { LuClock, LuBookOpen, LuUsers } from 'react-icons/lu';
import { LETTER_COLOR, LEVEL_LABEL, minutes } from '../lib/mbti';

export function TraitChips({ traits, userType }) {
  if (!traits) return null;
  return (
    <span className="traits" title="Personality traits this course is designed for">
      {traits.split('').map((t) => (
        <span key={t} className={`trait ${userType?.includes(t) ? 'match' : ''}`} style={{ '--tile': LETTER_COLOR[t] }}>{t}</span>
      ))}
    </span>
  );
}

export default function CourseCard({ course, userType, match, reasons, progress }) {
  return (
    <Link to={`/courses/${course.id}`} className="course-card" style={{ '--accent': course.color }}>
      <div className="course-band">
        <span className="course-cat">{course.category}</span>
        {typeof match === 'number' && <span className="course-match">{match}% match</span>}
      </div>
      <div className="course-body">
        <h3>{course.title}</h3>
        {reasons?.length ? <p className="course-reason">{reasons[0]}</p> : <p className="course-desc">{course.description}</p>}
        <div className="course-meta">
          <span><LuBookOpen /> {course.lessonCount} lessons</span>
          <span><LuClock /> {minutes(course.totalMinutes)}</span>
          {course.enrolledCount > 0 && <span><LuUsers /> {course.enrolledCount}</span>}
        </div>
        <div className="course-foot">
          <span className={`level level-${course.level.toLowerCase()}`}>{LEVEL_LABEL[course.level]}</span>
          <TraitChips traits={course.traits} userType={userType} />
        </div>
        {typeof progress === 'number' && (
          <div className="bar" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
        )}
      </div>
    </Link>
  );
}
