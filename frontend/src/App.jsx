import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import PublicHeader from './components/PublicHeader';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyLearning from './pages/MyLearning';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import WakeNotice from './components/WakeNotice';

function Splash() {
  return <div className="splash" aria-label="Loading"><span className="logo-mark spin"><i /><i /><i /><i /></span></div>;
}

function RequireAuth({ children, admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

/** Course pages are public; logged-in learners see them inside the app shell. */
function ShellIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Layout>{children}</Layout>;
  return (
    <>
      <PublicHeader />
      <main className="public-wrap" id="main">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <a href="#main" className="skip">Skip to content</a>
            <WakeNotice />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="/courses" element={<ShellIfAuthed><Courses /></ShellIfAuthed>} />
              <Route path="/courses/:id" element={<ShellIfAuthed><CourseDetail /></ShellIfAuthed>} />
              <Route element={<RequireAuth><Layout /></RequireAuth>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/my-learning" element={<MyLearning />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
