// src/context/AuthContext.jsx
// Autenticação via JWT + backend Node.js

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginRequest,
  logoutRequest,
  meRequest,
  heartbeatRequest,
  activityUsersRequest,
} from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'lf_token';
const USER_KEY  = 'lf_user';

// Funções de sessão local
const saveSession  = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
const loadToken = () => localStorage.getItem(TOKEN_KEY);
const loadUser  = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [currentUser,   setCurrentUser]   = useState(() => loadUser());
  const [loading,       setLoading]       = useState(() => !!loadToken());
  const [authError,     setAuthError]     = useState(null);
  const [activityUsers, setActivityUsers] = useState([]);

  // Valida token salvo ao abrir o app (mantém logado após reload)
  useEffect(() => {
    const token = loadToken();
    if (!token) { setLoading(false); return; }

    meRequest()
      .then((user) => { setCurrentUser(user); saveSession(token, user); })
      .catch(() => { clearSession(); setCurrentUser(null); })
      .finally(() => setLoading(false));
  }, []);

  // Ouve evento de token expirado (disparado pelo interceptor do Axios)
  useEffect(() => {
    const handle = () => { clearSession(); setCurrentUser(null); };
    window.addEventListener('auth:expired', handle);
    return () => window.removeEventListener('auth:expired', handle);
  }, []);

  // Heartbeat a cada 60s mantém o usuário marcado como online
  useEffect(() => {
    if (!currentUser) return;
    heartbeatRequest();
    const id = setInterval(heartbeatRequest, 60_000);
    return () => clearInterval(id);
  }, [currentUser]);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const { token, user } = await loginRequest(username, password);
      saveSession(token, user);
      setCurrentUser(user);
      return { ok: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Erro ao conectar com o servidor.';
      setAuthError(message);
      return { ok: false, message };
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutRequest(); // marca offline no banco
    clearSession();
    setCurrentUser(null);
  }, []);

  // ── busca usuários para o painel admin ────────────────────────────────────
  const fetchActivityUsers = useCallback(async () => {
    try {
      const users = await activityUsersRequest();
      setActivityUsers(users);
    } catch { /* silencioso se não for admin */ }
  }, []);

  const isAdmin       = currentUser?.role === 'admin';
  const currentUserId = currentUser?.id?.toString() || null;

  return (
    <AuthContext.Provider value={{
      currentUser, currentUserId, isAdmin,
      loading, authError,
      login, logout,
      activityUsers, fetchActivityUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
