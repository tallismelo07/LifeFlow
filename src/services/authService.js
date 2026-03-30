// src/services/authService.js

import api from './api';

// 🔐 LOGIN
export async function loginRequest(username, password) {
  const { data } = await api.post('/login', { username, password });
  return data; // { token, user }
}

// 🚪 LOGOUT
export async function logoutRequest() {
  try {
    await api.post('/logout');
  } catch {
    // silencioso por design
  }
}

// 👤 USUÁRIO ATUAL
export async function meRequest() {
  const { data } = await api.get('/me');
  return data.user;
}

// 💓 HEARTBEAT (mantém online)
export async function heartbeatRequest() {
  try {
    await api.patch('/heartbeat');
  } catch {
    // silencioso por design
  }
}

// 👥 ADMIN - usuários ativos
export async function activityUsersRequest() {
  const { data } = await api.get('/users');
  return data.users;
}

// 📊 BUSCAR DADOS DO USUÁRIO
export async function getDataRequest() {
  const { data } = await api.get('/data');
  return data.data; // inclui updated_at
}

// 💾 SALVAR DADOS DO USUÁRIO
export async function saveDataRequest(userData) {
  const { data } = await api.post('/data', { data: userData });
  return data;
}

// 🔑 ALTERAR SENHA
export async function changePasswordRequest(currentPassword, newPassword) {
  const { data } = await api.patch('/change-password', { currentPassword, newPassword });
  return data;
}

// 👤 ATUALIZAR PERFIL (nome + email)
export async function updateProfileRequest(name, email) {
  const { data } = await api.patch('/user/profile', { name, email });
  return data; // { ok, name, email }
}

// 💡 FEEDBACK
export async function sendFeedbackRequest(message) {
  const { data } = await api.post('/feedback', { message });
  return data;
}

// 📋 FEEDBACKS (admin)
export async function getFeedbacksRequest() {
  const { data } = await api.get('/feedbacks');
  return data.feedbacks;
}

// 📊 ATIVIDADE (admin)
export async function getActivityRequest() {
  const { data } = await api.get('/admin/activity');
  return data.users;
}

// 🔓 RESET DE SENHA (admin)
export async function resetPasswordRequest(username, newPassword) {
  const { data } = await api.patch('/reset-password', { username, newPassword });
  return data;
}

// 📋 LOGS DO SISTEMA (admin)
export async function getLogsRequest(limit = 200) {
  const { data } = await api.get(`/logs?limit=${limit}`);
  return data.logs;
}
