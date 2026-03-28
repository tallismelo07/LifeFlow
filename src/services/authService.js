// src/services/authService.js

import api from './api';

// 🔐 LOGIN
export async function loginRequest(username, password) {
  try {
    const { data } = await api.post('/login', {
      username,
      password,
    });

    // retorna { token, user }
    return data;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    throw error;
  }
}

// 🚪 LOGOUT
export async function logoutRequest() {
  try {
    await api.post('/logout');
  } catch (error) {
    console.warn('⚠️ Erro no logout (ignorado)');
  }
}

// 👤 USUÁRIO ATUAL
export async function meRequest() {
  try {
    const { data } = await api.get('/me');
    return data.user;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.response?.data || error.message);
    throw error;
  }
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
  try {
    const { data } = await api.get('/users');
    return data.users;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error.response?.data || error.message);
    throw error;
  }
}

// 📊 BUSCAR DADOS DO USUÁRIO
export async function getDataRequest() {
  try {
    const { data } = await api.get('/data');
    return data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.response?.data || error.message);
    throw error;
  }
}

// 💾 SALVAR DADOS DO USUÁRIO
export async function saveDataRequest(userData) {
  try {
    const { data } = await api.post('/data', {
      data: userData,
    });

    return data;
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error.response?.data || error.message);
    throw error;
  }
}