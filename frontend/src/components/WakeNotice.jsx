import { useEffect, useState } from 'react';

/** Shown when the API takes a while to answer, e.g. a free server waking from sleep. */
export default function WakeNotice() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const on = () => setSlow(true);
    const off = () => setSlow(false);
    window.addEventListener('pl:slow', on);
    window.addEventListener('pl:fast', off);
    return () => { window.removeEventListener('pl:slow', on); window.removeEventListener('pl:fast', off); };
  }, []);
  if (!slow) return null;
  return (
    <div className="wake" role="status">
      <span className="logo-mark spin" aria-hidden="true"><i /><i /><i /><i /></span>
      <div>
        <strong>Waking up the server…</strong>
        <small>The demo runs on a free server that sleeps when idle. This can take up to a minute the first time.</small>
      </div>
    </div>
  );
}
