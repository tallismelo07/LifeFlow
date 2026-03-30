// src/services/api.js

import axios from 'axios';

// ── URL base ─────────────────────────────────────────────────────────────────
//
//  Prioridade:
//  1. VITE_API_URL (variável definida no painel da Vercel)  ← PREFERIDO
//  2. Se estiver em produção (import.meta.env.PROD) usa a URL do Render diretamente
//  3. Em desenvolvimento usa o proxy do Vite (/api → localhost:3001)
//
//  COMO CONFIGURAR NA VERCEL:
//  Settings → Environment Variables → VITE_API_URL = https://lifeflow-73j3.onrender.com/api
//
const RENDER_URL = 'https://lifeflow-73j3.onrender.com/api';

const baseURL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? RENDER_URL : '/api');

const api = axios.create({
  baseURL,
  timeout: 30000,   // 30s — Render cold start pode demorar até 30s no free tier
  headers: { 'Content-Type': 'application/json' },
});

// Exporta a URL base para uso em fetch com keepalive (beforeunload)
export { baseURL as apiBaseURL };

// ── Interceptor de request: injeta token JWT ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Debug em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }

  return config;
});

// ── Interceptor de response: trata 401 globalmente ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url;
    const method  = error.config?.method?.toUpperCase();

    console.error(`[API ERROR] ${method} ${url} → ${status}`, error.response?.data || error.message);

    if (status === 401) {
      localStorage.removeItem('lf_token');
      localStorage.removeItem('lf_user');
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
