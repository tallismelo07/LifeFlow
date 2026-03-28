// src/context/AuthContext.jsx

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

// ── helpers ────────────────────────────────────────────────

const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const loadToken = () => localStorage.getItem(TOKEN_KEY);

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

// ── provider ───────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [activityUsers, setActivityUsers] = useState([]);

  // 🔐 valida token ao iniciar app
  useEffect(() => {
    const initAuth = async () => {
      const token = loadToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await meRequest();

        setCurrentUser(user);
        saveSession(token, user);
      } catch (error) {
        console.warn('Sessão inválida ou expirada');
        clearSession();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 🚨 escuta expiração de token (axios interceptor)
  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      setCurrentUser(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // 💓 heartbeat (mantém online)
  useEffect(() => {
    if (!currentUser) return;

    heartbeatRequest();

    const interval = setInterval(() => {
      heartbeatRequest();
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // 🔐 LOGIN
  const login = useCallback(async (username, password) => {
    setAuthError(null);

    try {
      const { token, user } = await loginRequest(username, password);

      saveSession(token, user);
      setCurrentUser(user);

      return { ok: true };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Erro ao conectar com o servidor.';

      setAuthError(message);

      return { ok: false, message };
    }
  }, []);

  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // ignora erro de rede
    }

    clearSession();
    setCurrentUser(null);
  }, []);

  // 👥 ADMIN - atividade
  const fetchActivityUsers = useCallback(async () => {
    try {
      const users = await activityUsersRequest();
      setActivityUsers(users);
    } catch {
      // não quebra se não for admin
    }
  }, []);

  // ── derivados ────────────────────────────────────────────

  const isAdmin = currentUser?.role === 'admin';
  const currentUserId = currentUser?.id?.toString() || null;
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentUserId,
        isAdmin,
        isAuthenticated,

        loading,
        authError,

        login,
        logout,

        activityUsers,
        fetchActivityUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── hook ───────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}