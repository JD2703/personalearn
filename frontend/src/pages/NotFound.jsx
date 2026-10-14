import { Link } from 'react-router-dom';
import TypeGlyph from '../components/TypeGlyph';

export default function NotFound() {
  return (
    <div className="page notfound">
      <TypeGlyph type="????" size="lg" placeholder />
      <h1>This page doesn’t exist</h1>
      <p className="muted">The link may be old, or the course was removed.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}
