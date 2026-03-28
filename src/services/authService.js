// src/services/authService.js
// Chamadas para os endpoints de auth do backend

import api from './api';

// POST /api/login -> { token, user }
export async function loginRequest(username, password) {
  const { data } = await api.post('/login', { username, password });
  return data;
}

// POST /api/logout
export async function logoutRequest() {
  try { await api.post('/logout'); } catch { /* não bloqueia */ }
}

// GET /api/me -> { user }
export async function meRequest() {
  const { data } = await api.get('/me');
  return data.user;
}

// PATCH /api/heartbeat — mantém online
export async function heartbeatRequest() {
  try { await api.patch('/heartbeat'); } catch { /* silencioso */ }
}

// GET /api/users (admin) -> { users: [...] }
export async function activityUsersRequest() {
  const { data } = await api.get('/users');
  return data.users;
}

// GET /api/data -> { data: {...} }
export async function getDataRequest() {
  const { data } = await api.get('/data');
  return data.data;
}

// POST /api/data { data: {...} } -> { ok: true }
export async function saveDataRequest(userData) {
  const { data } = await api.post('/data', { data: userData });
  return data;
}
