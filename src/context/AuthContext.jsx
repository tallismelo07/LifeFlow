// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { loginRequest, logoutRequest, meRequest, heartbeatRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lf_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verifica token no backend ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('lf_token');

    if (!token) {
      setLoading(false);
      return;
    }

    meRequest()
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem('lf_user', JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem('lf_token');
        localStorage.removeItem('lf_user');
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));

    // Escuta token expirado (disparado pelo interceptor do axios)
    const onExpired = () => setCurrentUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // Heartbeat a cada 60s para manter online
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(heartbeatRequest, 60_000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const login = async (username, password) => {
    try {
      const { token, user } = await loginRequest(username, password);
      localStorage.setItem('lf_token', token);
      localStorage.setItem('lf_user', JSON.stringify(user));
      setCurrentUser(user);
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao fazer login.';
      return { ok: false, message: msg };
    }
  };

  const logout = async () => {
    try { await logoutRequest(); } catch { /* ignora */ }
    localStorage.removeItem('lf_token');
    localStorage.removeItem('lf_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
