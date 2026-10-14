import { AXES } from '../lib/mbti';

/** Shows how strongly the learner leans on each of the four dichotomies. */
export default function AxisBars({ scores, compact = false }) {
  return (
    <div className={`axes ${compact ? 'axes-compact' : ''}`}>
      {AXES.map((a) => {
        const v = scores?.[a.score];
        const has = typeof v === 'number';
        const leansLeft = has && v >= 50;
        const pct = has ? (leansLeft ? v : 100 - v) : 50;
        // Marker position: 0% = fully left letter, 100% = fully right letter
        const pos = has ? 100 - v : 50;
        return (
          <div className="axis" key={a.key} style={{ '--ax': a.color }}>
            <div className="axis-labels">
              <span className={leansLeft ? 'on' : ''}>{a.leftName}</span>
              {!compact && <span className="axis-hint">{a.hint}</span>}
              <span className={has && !leansLeft ? 'on' : ''}>{a.rightName}</span>
            </div>
            <div className="axis-track" role="img" aria-label={has ? `${pct}% ${leansLeft ? a.leftName : a.rightName}` : 'No data'}>
              <span className="axis-fill" style={{ left: `${Math.min(pos, 50)}%`, width: `${Math.abs(50 - pos)}%` }} />
              <span className="axis-mid" />
              <span className="axis-dot" style={{ left: `${pos}%` }}>{has ? `${pct}%` : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
