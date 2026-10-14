import { useEffect, useRef, useState } from 'react';
import { LuSend, LuEraser } from 'react-icons/lu';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import Markdown from './Markdown';

const STARTERS = ['What should I learn next?', 'How should I study?', 'How am I doing?', 'Tell me about my type'];

export default function ChatPanel({ full = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState(STARTERS);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/chat').then(({ data }) => setMessages(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = async (msg) => {
    const content = (msg ?? text).trim();
    if (!content || busy) return;
    setText('');
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, sender: 'user', content }]);
    setBusy(true);
    try {
      const { data } = await api.post('/chat', { message: content });
      setMessages((m) => [...m, data]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch (err) {
      setMessages((m) => [...m, { id: `err-${Date.now()}`, sender: 'bot', content: errorMessage(err), error: true }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const clear = async () => {
    await api.delete('/chat');
    setMessages([]);
    setSuggestions(STARTERS);
  };

  const first = user?.name?.split(' ')[0];

  return (
    <div className={`chat ${full ? 'chat-full' : ''}`}>
      <div className="chat-log">
        {loaded && messages.length === 0 && (
          <div className="chat-empty">
            <div className="persona-avatar lg" aria-hidden="true"><span /><span /><span /><span /></div>
            <h4>Hi {first}, I’m Persona.</h4>
            <p>
              {user?.mbtiType
                ? `I know you’re an ${user.mbtiType}, so I’ll tailor course picks, study tips and pacing to how you learn.`
                : 'Take the personality quiz and I’ll tailor everything to how you learn.'}
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.sender}`}>
            {m.sender === 'bot' && <div className="persona-avatar" aria-hidden="true"><span /><span /><span /><span /></div>}
            <div className={`bubble ${m.error ? 'bubble-error' : ''}`}>
              {m.sender === 'bot' ? <Markdown text={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="bubble-row bot">
            <div className="persona-avatar thinking" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="bubble typing" aria-label="Persona is typing"><i /><i /><i /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="chat-suggest">
        {suggestions.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)} disabled={busy}>{s}</button>
        ))}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        {messages.length > 0 && (
          <button type="button" className="icon-btn" onClick={clear} title="Clear conversation" aria-label="Clear conversation"><LuEraser /></button>
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Persona anything about your learning…"
          maxLength={2000}
          aria-label="Message"
        />
        <button className="send-btn" disabled={!text.trim() || busy} aria-label="Send"><LuSend /></button>
      </form>
    </div>
  );
}
