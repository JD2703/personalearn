import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';
import Logo from '../components/Logo';
import TypeGlyph from '../components/TypeGlyph';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.mbtiType ? '/dashboard' : '/quiz'} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      navigate(location.state?.from || (u.mbtiType ? '/dashboard' : '/quiz'), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const demo = () => setForm({ name: '', email: 'demo@personalearn.com', password: 'demo123' });

  return (
    <div className="auth">
      <div className="auth-art" aria-hidden="true">
        <Logo />
        <div className="auth-art-body">
          <TypeGlyph type="ENFP" size="xl" animate />
          <p>Sixteen ways to learn. One of them is yours.</p>
        </div>
      </div>
      <div className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mobile-logo"><Logo /></div>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">{isLogin ? 'Log in to pick up where you left off.' : 'Next, a two-minute quiz to find your learning type.'}</p>

          {!isLogin && (
            <label className="field">
              <span>Name</span>
              <input value={form.name} onChange={set('name')} required maxLength={100} autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={set('password')} required minLength={isLogin ? 1 : 6}
              autoComplete={isLogin ? 'current-password' : 'new-password'} />
            {!isLogin && <small>At least 6 characters.</small>}
          </label>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>

          {isLogin && (
            <button type="button" className="btn btn-ghost btn-block" onClick={demo}>Fill in the demo account</button>
          )}

          <p className="auth-switch">
            {isLogin ? <>New here? <Link to="/register">Create an account</Link></> : <>Already have an account? <Link to="/login">Log in</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
