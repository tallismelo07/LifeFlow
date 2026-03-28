// src/context/AppContext.jsx
// Dados do usuário — persiste no LocalStorage (offline-first)
// Sincroniza com o backend quando disponível

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_DATA } from '../data/mockData';
import { getDataRequest, saveDataRequest } from '../services/authService';

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const today = () => new Date().toISOString().split('T')[0];

const lsKey = (username) => `lf_data_${username}`;

const emptyData = () => ({
  tasks: [], habits: [], transactions: [],
  studyItems: [], notes: [], goals: [], agenda: [],
});

// Carrega dados: LocalStorage > mockData > vazio
const loadLocal = (username) => {
  try {
    const v = localStorage.getItem(lsKey(username));
    if (v) return JSON.parse(v);
    return INITIAL_DATA[username]
      ? JSON.parse(JSON.stringify(INITIAL_DATA[username]))
      : emptyData();
  } catch { return emptyData(); }
};

const saveLocal = (username, data) => {
  try { localStorage.setItem(lsKey(username), JSON.stringify(data)); } catch {}
};

const AppContext = createContext(null);

export function AppProvider({ children, userId, username }) {
  const [data,     setData]    = useState(() => loadLocal(username));
  const [syncing,  setSyncing] = useState(false);

  // Recarrega quando usuário muda
  useEffect(() => { setData(loadLocal(username)); }, [username]);

  // Persiste no LocalStorage a cada mudança
  useEffect(() => {
    if (username) saveLocal(username, data);
  }, [username, data]);

  // Sincroniza com o backend (tenta ao montar — não bloqueia se falhar)
  useEffect(() => {
    if (!username) return;
    setSyncing(true);
    getDataRequest()
      .then((serverData) => {
        // Se o servidor tiver dados, usa eles (mais autoritativo)
        if (serverData && Object.keys(serverData).length > 0) {
          const hasContent = Object.values(serverData).some(
            (arr) => Array.isArray(arr) && arr.length > 0
          );
          if (hasContent) {
            setData(serverData);
            saveLocal(username, serverData);
          }
        }
      })
      .catch(() => { /* sem backend: usa localStorage */ })
      .finally(() => setSyncing(false));
  }, [username]);

  // ── Mutador genérico ────────────────────────────────────────────────────
  const update = useCallback((section, fn) => {
    setData((prev) => {
      const next = { ...prev, [section]: fn(prev[section] || []) };
      // Salva no backend de forma assíncrona (fire-and-forget)
      saveDataRequest(next).catch(() => {});
      return next;
    });
  }, []);

  // ── Tasks ────────────────────────────────────────────────────────────────
  const tasks       = data.tasks       || [];
  const addTask     = (t) => update('tasks', (a) => [{ ...t, id: genId(), createdAt: new Date().toISOString(), completed: false }, ...a]);
  const updateTask  = (id, u) => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteTask  = (id) => update('tasks', (a) => a.filter((x) => x.id !== id));
  const toggleTask  = (id) => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, completed: !x.completed } : x));

  // ── Habits ───────────────────────────────────────────────────────────────
  const habits      = data.habits      || [];
  const addHabit    = (h) => update('habits', (a) => [...a, { ...h, id: genId(), streak: 0, completedDates: [] }]);
  const deleteHabit = (id) => update('habits', (a) => a.filter((h) => h.id !== id));
  const toggleHabit = (id) => {
    const todayStr = today();
    update('habits', (hs) => hs.map((h) => {
      if (h.id !== id) return h;
      const done = h.completedDates.includes(todayStr);
      const completedDates = done
        ? h.completedDates.filter((d) => d !== todayStr)
        : [...h.completedDates, todayStr];
      // Recalcula streak
      let streak = 0;
      const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
      let cursor = new Date(todayStr);
      for (const d of sorted) {
        const diff = Math.round((cursor - new Date(d)) / 86400000);
        if (diff === 0 || diff === 1) { streak++; cursor = new Date(d); } else break;
      }
      return { ...h, completedDates, streak };
    }));
  };

  // ── Finance ──────────────────────────────────────────────────────────────
  const transactions     = data.transactions  || [];
  const totalIncome      = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense     = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance          = totalIncome - totalExpense;
  const addTransaction   = (tx) => update('transactions', (a) => [{ ...tx, id: genId(), date: new Date().toISOString() }, ...a]);
  const deleteTransaction = (id) => update('transactions', (a) => a.filter((t) => t.id !== id));

  // ── Study ────────────────────────────────────────────────────────────────
  const studyItems       = data.studyItems    || [];
  const addStudyItem     = (item) => update('studyItems', (a) => [{ ...item, id: genId(), progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateStudyItem  = (id, u) => update('studyItems', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteStudyItem  = (id) => update('studyItems', (a) => a.filter((x) => x.id !== id));

  // ── Notes ────────────────────────────────────────────────────────────────
  const notes      = data.notes        || [];
  const addNote    = (n) => update('notes', (a) => [{ ...n, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateNote = (id, u) => update('notes', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteNote = (id) => update('notes', (a) => a.filter((x) => x.id !== id));

  // ── Goals ────────────────────────────────────────────────────────────────
  const goals      = data.goals        || [];
  const addGoal    = (g) => update('goals', (a) => [{ ...g, id: genId(), createdAt: new Date().toISOString() }, ...a]);
  const updateGoal = (id, u) => update('goals', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteGoal = (id) => update('goals', (a) => a.filter((x) => x.id !== id));

  // ── Agenda ───────────────────────────────────────────────────────────────
  const agenda      = data.agenda      || [];
  const addEvent    = (ev) => update('agenda', (a) => [...a, { ...ev, id: genId(), createdAt: new Date().toISOString() }]);
  const updateEvent = (id, u) => update('agenda', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteEvent = (id) => update('agenda', (a) => a.filter((x) => x.id !== id));

  // ── Nav ──────────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  return (
    <AppContext.Provider value={{
      syncing,
      tasks, addTask, updateTask, deleteTask, toggleTask,
      habits, addHabit, deleteHabit, toggleHabit,
      transactions, totalIncome, totalExpense, balance, addTransaction, deleteTransaction,
      studyItems, addStudyItem, updateStudyItem, deleteStudyItem,
      notes, addNote, updateNote, deleteNote,
      goals, addGoal, updateGoal, deleteGoal,
      agenda, addEvent, updateEvent, deleteEvent,
      activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
