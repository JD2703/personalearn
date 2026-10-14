import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../context/AuthContext';
import TypeGlyph from '../components/TypeGlyph';

export default function ChatPage() {
  const { user } = useAuth();
  return (
    <div className="page chat-page">
      <div className="page-head">
        <div>
          <h1>Persona</h1>
          <p className="muted">Your learning companion. It knows your type, your progress and what you’re studying.</p>
        </div>
        <TypeGlyph type={user?.mbtiType} size="sm" />
      </div>
      <ChatPanel full />
    </div>
  );
}
