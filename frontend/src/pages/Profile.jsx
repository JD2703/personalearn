import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TypeGlyph from '../components/TypeGlyph';
import AxisBars from '../components/AxisBars';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user.mbtiType) api.get(`/mbti/types/${user.mbtiType}`).then(({ data }) => setProfile(data)).catch(() => {});
  }, [user.mbtiType]);

  const saveName = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/me', { name });
      setUser(data);
      toast('Name saved');
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  const savePw = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast('Password updated');
    } catch (err) { toast(errorMessage(err), 'error'); }
  };

  return (
    <div className="page">
      <div className="page-head"><div><h1>Profile</h1><p className="muted">{user.email} · member since {new Date(user.createdAt).toLocaleDateString()}</p></div></div>
      <div className="profile-grid">
        <section className="panel profile-type">
          <TypeGlyph type={user.mbtiType} size="lg" placeholder={!user.mbtiType} />
          {user.mbtiType ? (
            <>
              <h2>{profile?.nickname}</h2>
              <p>{profile?.summary}</p>
              <AxisBars scores={user} compact />
              <Link to="/quiz" className="btn btn-ghost">Retake quiz</Link>
            </>
          ) : (
            <>
              <h2>No type yet</h2>
              <p>Take the quiz to personalise your courses and coaching.</p>
              <Link to="/quiz" className="btn btn-primary">Take the quiz</Link>
            </>
          )}
        </section>
        <div className="stack">
          <form className="panel" onSubmit={saveName}>
            <h2>Your details</h2>
            <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /></label>
            <label className="field"><span>Email</span><input value={user.email} disabled /></label>
            <button className="btn btn-primary" disabled={name.trim() === user.name}>Save name</button>
          </form>
          <form className="panel" onSubmit={savePw}>
            <h2>Change password</h2>
            <label className="field"><span>Current password</span>
              <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" /></label>
            <label className="field"><span>New password</span>
              <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={6} autoComplete="new-password" /></label>
            <button className="btn btn-primary">Update password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
