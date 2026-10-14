import { useEffect, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import { LEVEL_LABEL } from '../lib/mbti';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [fitOnly, setFitOnly] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/courses', { params: { search: search || undefined, category: category || undefined, level: level || undefined } })
        .then(({ data }) => { setCourses(data); setError(''); })
        .catch((e) => setError(errorMessage(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [search, category, level]);

  const type = user?.mbtiType;
  const fit = (c) => (type && c.traits ? c.traits.split('').filter((t) => type.includes(t)).length / c.traits.length : 0);
  const shown = (courses || []).filter((c) => !fitOnly || fit(c) >= 0.66);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Courses</h1>
          <p className="muted">
            {type ? <>Letters that match your type ({type}) are highlighted on each course.</> : 'Every course is tagged with the personality traits it suits.'}
          </p>
        </div>
      </div>

      <div className="filters">
        <label className="search">
          <LuSearch aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses" aria-label="Search courses" />
        </label>
        <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level">
          <option value="">All levels</option>
          {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {type && (
          <label className="toggle">
            <input type="checkbox" checked={fitOnly} onChange={(e) => setFitOnly(e.target.checked)} />
            <span>Strong fit for {type}</span>
          </label>
        )}
      </div>
      <div className="chips-row" role="tablist" aria-label="Category">
        <button className={`chip ${!category ? 'on' : ''}`} onClick={() => setCategory('')}>All</button>
        {categories.map((c) => (
          <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {error && <div className="empty"><p>{error}</p></div>}
      {!courses && !error && <div className="grid-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}</div>}
      {courses && (
        shown.length ? (
          <div className="grid-3">{shown.map((c) => <CourseCard key={c.id} course={c} userType={type} />)}</div>
        ) : (
          <div className="empty">
            <h2>No courses match</h2>
            <p>Try a different search or clear the filters.</p>
            <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategory(''); setLevel(''); setFitOnly(false); }}>Clear filters</button>
          </div>
        )
      )}
    </div>
  );
}
