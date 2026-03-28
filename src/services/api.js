// src/services/api.js

import axios from 'axios';

// 🔥 Detecta ambiente automaticamente
const isDev = import.meta.env.DEV;

// 👉 LOCAL usa proxy do Vite
// 👉 PRODUÇÃO usa URL do Render
const baseURL = isDev
  ? '/api'
  : import.meta.env.VITE_API_URL;

// ⚠️ fallback de segurança (caso esqueça .env)
const finalBaseURL = baseURL || 'https://lifeflow-73j3.onrender.com/api';

const api = axios.create({
  baseURL: finalBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Injeta token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lf_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🚨 Intercepta erros globais (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔒 Sessão expirada');

      localStorage.removeItem('lf_token');
      localStorage.removeItem('lf_user');

      // dispara evento global para logout
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export default api;