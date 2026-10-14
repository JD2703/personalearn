import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LuX } from 'react-icons/lu';
import ChatPanel from './ChatPanel';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  if (pathname === '/chat') return null;

  return (
    <>
      {open && (
        <div className="chat-pop" role="dialog" aria-label="Persona learning companion">
          <header>
            <div>
              <strong>Persona</strong>
              <small>Your learning companion</small>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close chat"><LuX /></button>
          </header>
          <ChatPanel />
        </div>
      )}
      <button className={`chat-fab ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close chat' : 'Chat with Persona'}>
        <span className="persona-avatar fab" aria-hidden="true"><span /><span /><span /><span /></span>
        {!open && <span className="fab-label">Ask Persona</span>}
      </button>
    </>
  );
}
