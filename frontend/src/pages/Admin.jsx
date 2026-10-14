import { useCallback, useEffect, useState } from 'react';
import { LuPlus, LuPencil, LuTrash2, LuListChecks } from 'react-icons/lu';
import api, { errorMessage } from '../api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { TraitChips } from '../components/CourseCard';
import { FORMAT_LABEL, LEVEL_LABEL, LETTER_COLOR } from '../lib/mbti';

const EMPTY_COURSE = { title: '', description: '', category: '', level: 'BEGINNER', instructor: '', traits: '', color: '#5b4bdb' };
const EMPTY_LESSON = { title: '', content: '', format: 'READING', durationMinutes: 15 };

function CourseForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, traits: f.traits.toUpperCase() }); }}>
      <label className="field span-2"><span>Title</span><input value={f.title} onChange={set('title')} required maxLength={150} /></label>
      <label className="field span-2"><span>Description</span><textarea rows={3} value={f.description || ''} onChange={set('description')} maxLength={2000} /></label>
      <label className="field"><span>Category</span><input value={f.category} onChange={set('category')} required maxLength={60} list="cats" /></label>
      <label className="field"><span>Level</span>
        <select value={f.level} onChange={set('level')}>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </label>
      <label className="field"><span>Instructor</span><input value={f.instructor || ''} onChange={set('instructor')} maxLength={80} /></label>
      <label className="field"><span>Accent colour</span><input type="color" value={f.color} onChange={set('color')} /></label>
      <label className="field span-2">
        <span>Target traits</span>
        <input value={f.traits} onChange={set('traits')} pattern="[EISNTFJPeisntfjp]{0,8}" placeholder="e.g. NTJ" maxLength={8} />
        <small>MBTI letters this course suits best. Drives the recommendation score.</small>
      </label>
      <div className="form-actions span-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary">Save course</button>
      </div>
    </form>
  );
}

function LessonManager({ course, onChanged }) {
  const toast = useToast();
  const [lessons, setLessons] = useState([]);
  const [editing, setEditing] = useState(null); // lesson object or 'new'
  const [form, setForm] = useState(EMPTY_LESSON);

  const load = useCallback(() => api.get(`/admin/courses/${course.id}/lessons`).then(({ data }) => setLessons(data)), [course.id]);
  useEffect(() => { load(); }, [load]);

  const start = (l) => { setEditing(l); setForm(l === 'new' ? EMPTY_LESSON : { title: l.title, content: l.content || '', format: l.format, durationMinutes: l.durationMinutes, orderIndex: l.orderIndex }); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await api.post(`/admin/courses/${course.id}/lessons`, { ...form, durationMinutes: Number(form.durationMinutes) });
      else await api.put(`/admin/lessons/${editing.id}`, { ...form, durationMinutes: Number(form.durationMinutes) });
      toast(editing === 'new' ? 'Lesson added' : 'Lesson saved');
      setEditing(null);
      load(); onChanged();
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const remove = async (l) => {
    if (!window.confirm(`Delete “${l.title}”?`)) return;
    await api.delete(`/admin/lessons/${l.id}`);
    toast('Lesson deleted');
    load(); onChanged();
  };

  if (editing) {
    return (
      <form className="form-grid" onSubmit={save}>
        <label className="field span-2"><span>Lesson title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={150} /></label>
        <label className="field"><span>Format</span>
          <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            {Object.entries(FORMAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="field"><span>Minutes</span><input type="number" min={1} max={600} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required /></label>
        <label className="field span-2"><span>Content</span><textarea rows={9} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /><small>Supports **bold**, `code`, bullet lists and ``` code blocks.</small></label>
        <div className="form-actions span-2">
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn btn-primary">{editing === 'new' ? 'Add lesson' : 'Save lesson'}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <ol className="admin-lessons">
        {lessons.map((l, i) => (
          <li key={l.id}>
            <span className="lesson-num">{i + 1}</span>
            <div><strong>{l.title}</strong><small>{FORMAT_LABEL[l.format]} · {l.durationMinutes} min</small></div>
            <button className="icon-btn" onClick={() => start(l)} aria-label={`Edit ${l.title}`}><LuPencil /></button>
            <button className="icon-btn danger" onClick={() => remove(l)} aria-label={`Delete ${l.title}`}><LuTrash2 /></button>
          </li>
        ))}
        {!lessons.length && <p className="muted">No lessons yet.</p>}
      </ol>
      <button className="btn btn-primary" onClick={() => start('new')}><LuPlus /> Add lesson</button>
    </div>
  );
}

export default function Admin() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null); // {kind:'course', course} | {kind:'lessons', course}

  const load = useCallback(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch((e) => toast(errorMessage(e), 'error'));
    api.get('/courses').then(({ data }) => setCourses(data));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const saveCourse = async (form) => {
    try {
      if (modal.course?.id) await api.put(`/admin/courses/${modal.course.id}`, form);
      else await api.post('/admin/courses', form);
      toast(modal.course?.id ? 'Course saved' : 'Course created');
      setModal(null);
      load();
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete “${c.title}”? This removes its lessons and learner progress.`)) return;
    try {
      await api.delete(`/admin/courses/${c.id}`);
      toast('Course deleted');
      load();
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const dist = stats?.typeDistribution || {};
  const maxType = Math.max(1, ...Object.values(dist));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Admin</h1><p className="muted">Manage the catalogue and see who’s learning.</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ kind: 'course', course: null })}><LuPlus /> New course</button>
      </div>

      {stats && (
        <section className="stats">
          <div className="stat"><strong>{stats.users}</strong><span>learners</span></div>
          <div className="stat"><strong>{stats.courses}</strong><span>courses</span></div>
          <div className="stat"><strong>{stats.enrollments}</strong><span>enrolments</span></div>
          <div className="stat"><strong>{stats.lessonsCompleted}</strong><span>lessons completed</span></div>
        </section>
      )}

      <section className="panel">
        <h2>Learners by personality type</h2>
        {Object.keys(dist).length === 0 ? <p className="muted">No learners have taken the quiz yet.</p> : (
          <div className="type-dist">
            {Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
              <div key={t} className="type-dist-row">
                <span className="type-dist-label">{t.split('').map((l, i) => <b key={i} style={{ color: LETTER_COLOR[l] }}>{l}</b>)}</span>
                <span className="type-dist-bar"><i style={{ width: `${(n / maxType) * 100}%` }} /></span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Courses</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Course</th><th>Level</th><th>Traits</th><th>Lessons</th><th>Learners</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span className="swatch" style={{ background: c.color }} /> <strong>{c.title}</strong><br /><small className="muted">{c.category}</small></td>
                  <td>{LEVEL_LABEL[c.level]}</td>
                  <td><TraitChips traits={c.traits} /></td>
                  <td>{c.lessonCount}</td>
                  <td>{c.enrolledCount}</td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => setModal({ kind: 'lessons', course: c })} aria-label={`Manage lessons for ${c.title}`} title="Lessons"><LuListChecks /></button>
                    <button className="icon-btn" onClick={() => setModal({ kind: 'course', course: c })} aria-label={`Edit ${c.title}`} title="Edit"><LuPencil /></button>
                    <button className="icon-btn danger" onClick={() => remove(c)} aria-label={`Delete ${c.title}`} title="Delete"><LuTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <datalist id="cats">{[...new Set(courses.map((c) => c.category))].map((c) => <option key={c} value={c} />)}</datalist>

      {modal?.kind === 'course' && (
        <Modal title={modal.course ? 'Edit course' : 'New course'} onClose={() => setModal(null)} wide>
          <CourseForm
            initial={modal.course ? { ...EMPTY_COURSE, ...modal.course } : EMPTY_COURSE}
            onSave={saveCourse}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.kind === 'lessons' && (
        <Modal title={`Lessons · ${modal.course.title}`} onClose={() => setModal(null)} wide>
          <LessonManager course={modal.course} onChanged={load} />
        </Modal>
      )}
    </div>
  );
}
