export default function ProgressRing({ value = 0, size = 56, stroke = 6, color = 'var(--ink)', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="ring-arc"
        />
      </svg>
      <span className="ring-label">{label ?? `${Math.round(v)}%`}</span>
    </div>
  );
}
