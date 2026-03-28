// src/services/api.js

import axios from 'axios';

// 🔥 pega variável de ambiente
const API_URL = import.meta.env.VITE_API_URL;

// 👉 fallback garantido
const baseURL = API_URL || 'https://lifeflow-73j3.onrender.com/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 token automático
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lf_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🚨 tratamento global de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔒 Sessão expirada');

      localStorage.removeItem('lf_token');
      localStorage.removeItem('lf_user');

      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export default api;