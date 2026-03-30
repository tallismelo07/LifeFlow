// src/context/AppContext.jsx
// Dados do usuário — offline-first com sincronização confiável
//
// Fluxo correto:
//  1. Init: carrega localStorage (UI instantânea)
//  2. Mount: GET /api/data — servidor é a fonte de verdade
//  3. Toda mutação: atualiza state puro (sem side-effect)
//  4. useEffect debounced: POST /api/data 800ms após última mudança
//  5. Retry automático se o save falhar (até 3 tentativas)

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getDataRequest, saveDataRequest } from '../services/authService';

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const today = () => new Date().toISOString().split('T')[0];

const lsKey     = (username) => `lf_data_${username}`;
const emptyData = () => ({
  tasks: [], habits: [], transactions: [],
  studyItems: [], notes: [], goals: [], agenda: [],
});

const loadLocal = (username) => {
  if (!username) return emptyData();
  try {
    const v = localStorage.getItem(lsKey(username));
    return v ? { ...emptyData(), ...JSON.parse(v) } : emptyData();
  } catch { return emptyData(); }
};

const saveLocal = (username, data) => {
  if (!username) return;
  try { localStorage.setItem(lsKey(username), JSON.stringify(data)); } catch {}
};

// Salva no backend com retry automático
async function saveWithRetry(data, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await saveDataRequest(data);
      console.log('[AppContext] ✓ Dados salvos no servidor');
      return true;
    } catch (err) {
      const isLast = attempt === maxAttempts;
      console.warn(`[AppContext] ✗ Falha ao salvar (tentativa ${attempt}/${maxAttempts})`, err.message);
      if (isLast) return false;
      // Espera antes de retry: 1s, 2s
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  return false;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const username = currentUser?.username;

  const [data,    setData]    = useState(() => loadLocal(username));
  const [syncing, setSyncing] = useState(false);
  const [saveErr, setSaveErr] = useState(false); // flag de erro de save

  // Ref para controlar se o dado inicial já veio do servidor
  const serverSynced = useRef(false);
  // Ref para o timer de debounce do save
  const saveTimer    = useRef(null);
  // Ref para saber se é o primeiro render (não salvar o emptyData inicial)
  const isFirstRender = useRef(true);

  // ── Reseta ao trocar de usuário ─────────────────────────────
  useEffect(() => {
    serverSynced.current = false;
    isFirstRender.current = true;
    setData(loadLocal(username));
    setSaveErr(false);
  }, [username]);

  // ── Persiste no localStorage a cada mudança ─────────────────
  useEffect(() => {
    if (username) saveLocal(username, data);
  }, [username, data]);

  // ── SINCRONIZAÇÃO INICIAL — servidor é a fonte de verdade ───
  // Se o servidor responder (mesmo com arrays vazios) → usa servidor.
  // Só usa localStorage se o servidor estiver inacessível (offline).
  useEffect(() => {
    if (!username) return;

    setSyncing(true);
    console.log('[AppContext] Buscando dados do servidor...');

    getDataRequest()
      .then((serverData) => {
        if (!serverData) return;

        console.log('[AppContext] ✓ Dados recebidos do servidor:', {
          tasks:        serverData.tasks?.length        ?? 0,
          habits:       serverData.habits?.length       ?? 0,
          notes:        serverData.notes?.length        ?? 0,
          goals:        serverData.goals?.length        ?? 0,
          agenda:       serverData.agenda?.length       ?? 0,
          studyItems:   serverData.studyItems?.length   ?? 0,
          transactions: serverData.transactions?.length ?? 0,
        });

        // Servidor sempre vence — é a fonte de verdade
        const merged = { ...emptyData(), ...serverData };
        setData(merged);
        saveLocal(username, merged);
        serverSynced.current = true;
      })
      .catch((err) => {
        // Servidor inacessível → mantém localStorage (modo offline)
        console.warn('[AppContext] Servidor inacessível, usando localStorage:', err.message);
        serverSynced.current = false;
      })
      .finally(() => setSyncing(false));
  // Só roda quando o username muda (login/logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // ── SAVE DEBOUNCED — dispara 800ms após última mutação ──────
  // Usa useEffect puro (fora do setData) para evitar race conditions.
  // O debounce garante que rapidez nas ações não gera requests paralelos.
  useEffect(() => {
    // Não salva no primeiro render (dados acabaram de carregar do localStorage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Não salva se não há usuário
    if (!username) return;

    // Cancela save anterior se veio outra mudança dentro de 800ms
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      console.log('[AppContext] Salvando dados no servidor...', { username });
      const ok = await saveWithRetry(data);
      setSaveErr(!ok);
      if (!ok) {
        console.error('[AppContext] ✗ Falha persistente ao salvar. Dados no localStorage, mas não no servidor.');
      }
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, username]);

  // ── Mutador genérico (puro — sem side-effects) ──────────────
  // O save para o servidor acontece via useEffect acima.
  const update = useCallback((section, fn) => {
    setData((prev) => ({
      ...prev,
      [section]: fn(prev[section] || []),
    }));
  }, []);

  // ── Tasks ───────────────────────────────────────────────────
  const tasks      = data.tasks      || [];
  const addTask    = (t)     => update('tasks', (a) => [{ ...t, id: genId(), createdAt: new Date().toISOString(), completed: false }, ...a]);
  const updateTask = (id, u) => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteTask = (id)    => update('tasks', (a) => a.filter((x) => x.id !== id));
  const toggleTask = (id)    => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, completed: !x.completed } : x));

  // ── Habits ──────────────────────────────────────────────────
  const habits      = data.habits || [];
  const addHabit    = (h)  => update('habits', (a) => [...a, { ...h, id: genId(), streak: 0, completedDates: [] }]);
  const deleteHabit = (id) => update('habits', (a) => a.filter((h) => h.id !== id));
  const toggleHabit = (id) => {
    const todayStr = today();
    update('habits', (hs) => hs.map((h) => {
      if (h.id !== id) return h;
      const done = h.completedDates.includes(todayStr);
      const completedDates = done
        ? h.completedDates.filter((d) => d !== todayStr)
        : [...h.completedDates, todayStr];
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

  // ── Finance ─────────────────────────────────────────────────
  const transactions      = data.transactions || [];
  const totalIncome       = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense      = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance           = totalIncome - totalExpense;
  const addTransaction    = (tx) => update('transactions', (a) => [{ ...tx, id: genId(), date: new Date().toISOString() }, ...a]);
  const deleteTransaction = (id) => update('transactions', (a) => a.filter((t) => t.id !== id));

  // ── Study ───────────────────────────────────────────────────
  const studyItems      = data.studyItems || [];
  const addStudyItem    = (item) => update('studyItems', (a) => [{ ...item, id: genId(), progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateStudyItem = (id, u) => update('studyItems', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteStudyItem = (id)    => update('studyItems', (a) => a.filter((x) => x.id !== id));

  // ── Notes ───────────────────────────────────────────────────
  const notes      = data.notes || [];
  const addNote    = (n)     => update('notes', (a) => [{ ...n, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateNote = (id, u) => update('notes', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteNote = (id)    => update('notes', (a) => a.filter((x) => x.id !== id));

  // ── Goals ───────────────────────────────────────────────────
  const goals      = data.goals || [];
  const addGoal    = (g)     => update('goals', (a) => [{ ...g, id: genId(), createdAt: new Date().toISOString() }, ...a]);
  const updateGoal = (id, u) => update('goals', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteGoal = (id)    => update('goals', (a) => a.filter((x) => x.id !== id));

  // ── Agenda ──────────────────────────────────────────────────
  const agenda      = data.agenda || [];
  const addEvent    = (ev)    => update('agenda', (a) => [...a, { ...ev, id: genId(), createdAt: new Date().toISOString() }]);
  const updateEvent = (id, u) => update('agenda', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteEvent = (id)    => update('agenda', (a) => a.filter((x) => x.id !== id));

  // ── Nav ─────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppContext.Provider value={{
      syncing,
      saveErr, // true se o último save falhou (pode mostrar aviso na UI)
      tasks,        addTask,    updateTask, deleteTask, toggleTask,
      habits,       addHabit,  deleteHabit, toggleHabit,
      transactions, totalIncome, totalExpense, balance, addTransaction, deleteTransaction,
      studyItems,   addStudyItem, updateStudyItem, deleteStudyItem,
      notes,        addNote,   updateNote, deleteNote,
      goals,        addGoal,   updateGoal, deleteGoal,
      agenda,       addEvent,  updateEvent, deleteEvent,
      activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
