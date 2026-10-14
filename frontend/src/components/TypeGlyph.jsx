import { LETTER_COLOR } from '../lib/mbti';

/** The learner's four-letter type, one tile per axis. Shapes alternate so it reads without colour too. */
export default function TypeGlyph({ type, size = 'md', animate = false, placeholder = false }) {
  const letters = (type || '????').split('');
  return (
    <div className={`glyph glyph-${size} ${animate ? 'glyph-animate' : ''}`} aria-label={type ? `Personality type ${type}` : 'Type not set'}>
      {letters.map((l, i) => (
        <span
          key={i}
          className={`glyph-tile ${i % 3 === 0 ? 'round' : 'square'} ${placeholder || l === '?' ? 'is-empty' : ''}`}
          style={{ '--tile': l === '?' ? 'var(--line)' : LETTER_COLOR[l], animationDelay: `${i * 90}ms` }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}
