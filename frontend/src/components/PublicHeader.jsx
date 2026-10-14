import { Link } from 'react-router-dom';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

export default function PublicHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="land-top">
      <Logo />
      <nav>
        <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">{theme === 'dark' ? <LuSun /> : <LuMoon />}</button>
        <Link to="/login" className="btn btn-ghost">Log in</Link>
        <Link to="/register" className="btn btn-primary">Create account</Link>
      </nav>
    </header>
  );
}
