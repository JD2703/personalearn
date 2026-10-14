import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('pl_token'));

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('pl_token')) { setLoading(false); return null; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onLogout = () => setUser(null);
    window.addEventListener('pl:logout', onLogout);
    return () => window.removeEventListener('pl:logout', onLogout);
  }, [refresh]);

  const acceptAuth = (data) => {
    localStorage.setItem('pl_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => acceptAuth((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) => acceptAuth((await api.post('/auth/register', { name, email, password })).data);
  const logout = () => { localStorage.removeItem('pl_token'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
