import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LuLayoutDashboard, LuLibrary, LuGraduationCap, LuMessageCircle, LuUser, LuShieldCheck, LuLogOut, LuMoon, LuSun } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TypeGlyph from './TypeGlyph';
import ChatWidget from './ChatWidget';
import Logo from './Logo';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
  { to: '/courses', label: 'Courses', icon: LuLibrary },
  { to: '/my-learning', label: 'My learning', icon: LuGraduationCap },
  { to: '/chat', label: 'Persona', icon: LuMessageCircle },
  { to: '/profile', label: 'Profile', icon: LuUser },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const nav = user?.role === 'ADMIN' ? [...NAV, { to: '/admin', label: 'Admin', icon: LuShieldCheck }] : NAV;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo to="/dashboard" />
        <nav className="side-nav" aria-label="Main">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <NavLink to="/profile" className="side-user">
            <TypeGlyph type={user?.mbtiType} size="xs" />
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.mbtiType ? user.mbtiType : 'Type not set'}</small>
            </div>
          </NavLink>
          <div className="side-actions">
            <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <LuSun /> : <LuMoon />}
            </button>
            <button className="icon-btn" onClick={() => { logout(); navigate('/'); }} aria-label="Log out" title="Log out"><LuLogOut /></button>
          </div>
        </div>
      </aside>

      <header className="mobile-top">
        <Logo to="/dashboard" />
        <div className="side-actions">
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">{theme === 'dark' ? <LuSun /> : <LuMoon />}</button>
          <button className="icon-btn" onClick={() => { logout(); navigate('/'); }} aria-label="Log out"><LuLogOut /></button>
        </div>
      </header>

      <main className="main" id="main">
        {children ?? <Outlet />}
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {nav.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <ChatWidget />
    </div>
  );
}
