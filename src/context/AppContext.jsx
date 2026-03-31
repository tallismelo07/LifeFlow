// src/context/AppContext.jsx
// ════════════════════════════════════════════════════════════
//  Fluxo de dados confiável — sem perda de dados
//
//  REGRAS DO SISTEMA:
//  1. localStorage  = cache local rápido (nunca fonte de verdade)
//  2. Servidor      = fonte de verdade final
//  3. Nunca aplicar dados VAZIOS do servidor sobre dados LOCAIS não vazios
//  4. Se servidor vazio mas local tem dados → upload imediato (recuperação)
//  5. Save debounced 400ms + beforeunload (keepalive) = zero perda no refresh
//  6. Polling a cada 5s = sincronização entre dispositivos
//
//  ARQUITETURA DE RE-RENDER:
//  Navegação (activeTab, sidebarOpen) foi movida para NavContext.
//  AppContext só contém dados. Componentes de navegação (BottomNav,
//  Sidebar) subscrevem NavContext — nunca re-renderizam por mudança de dados.
// ════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getDataRequest, saveDataRequest } from '../services/authService';
import { apiBaseURL } from '../services/api';

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const today = () => new Date().toISOString().split('T')[0];

const DATA_FIELDS = ['tasks', 'habits', 'transactions', 'studyItems', 'notes', 'goals', 'agenda', 'cards'];

const emptyData = () => ({
  tasks: [], habits: [], transactions: [],
  studyItems: [], notes: [], goals: [], agenda: [], cards: [],
});

function countItems(d) {
  if (!d) return 0;
  return DATA_FIELDS.reduce((n, k) => n + ((d[k] || []).length), 0);
}

// ── localStorage helpers ──────────────────────────────────────
const lsKey = (u) => `lf_data_${u}`;

function loadLocal(username) {
  if (!username) return emptyData();
  try {
    const raw = localStorage.getItem(lsKey(username));
    if (!raw) return emptyData();
    return { ...emptyData(), ...JSON.parse(raw) };
  } catch { return emptyData(); }
}

function saveLocal(username, data) {
  if (!username) return;
  try { localStorage.setItem(lsKey(username), JSON.stringify(data)); } catch {}
}

// ── Salva no backend com retry automático ─────────────────────
async function saveWithRetry(data, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await saveDataRequest(data);
      console.log(`[AppContext] ✓ Salvo (tentativa ${attempt}) total=${countItems(data)}`);
      return { ok: true };
    } catch (err) {
      console.warn(`[AppContext] ✗ Falha ao salvar (${attempt}/${maxAttempts}):`, err.message);
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, attempt * 800));
    }
  }
  console.error('[AppContext] ✗✗ Falha persistente no servidor');
  return { ok: false };
}

// ── Contexto ──────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const username = currentUser?.username;

  // Único estado React neste contexto = os dados do usuário.
  // Não há estado de "saving", "syncing" ou "error" aqui —
  // esses nunca devem causar re-render nos componentes de UI.
  const [data, setData] = useState(() => loadLocal(username));

  const dataRef         = useRef(data);
  const saveTimer       = useRef(null);
  const isFirstRender   = useRef(true);
  const pendingChanges  = useRef(false);
  const lastServerTs    = useRef(null);
  const initialSyncDone = useRef(false);
  // Bloqueia saves antes do initialSync completar — evita sobrescrever servidor com estado vazio
  const dataLoaded      = useRef(false);

  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Reset ao trocar de usuário ────────────────────────────
  useEffect(() => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    isFirstRender.current   = true;
    pendingChanges.current  = false;
    lastServerTs.current    = null;
    initialSyncDone.current = false;

    const local = loadLocal(username);
    dataLoaded.current = false;
    setData(local);
    dataRef.current = local;
  }, [username]);

  // ── Persiste no localStorage a cada mudança ───────────────
  useEffect(() => {
    if (username) saveLocal(username, data);
  }, [username, data]);

  // ── SINCRONIZAÇÃO INICIAL ─────────────────────────────────
  useEffect(() => {
    if (!username || initialSyncDone.current) return;
    initialSyncDone.current = true;

    console.log('[AppContext] 🔄 Sincronização inicial...');

    getDataRequest()
      .then((serverData) => {
        if (!serverData) {
          dataLoaded.current = true;
          return;
        }

        const serverTotal = countItems(serverData);
        const localData   = loadLocal(username);
        const localTotal  = countItems(localData);

        console.log(`[AppContext] Servidor: ${serverTotal} | Local: ${localTotal}`);

        if (serverTotal === 0 && localTotal > 0) {
          // Caso A: servidor vazio mas local tem dados → upload de recuperação
          console.log('[AppContext] ⚠ Upload de recuperação...');
          saveWithRetry(localData).then(({ ok }) => {
            if (ok) { lastServerTs.current = new Date().toISOString(); pendingChanges.current = false; }
          });
          dataLoaded.current = true;
          return;
        }

        if (serverTotal === 0 && localTotal === 0) {
          // Caso D: novo usuário — sem dados em lugar nenhum
          lastServerTs.current = serverData.updated_at || null;
          dataLoaded.current = true;
          return;
        }

        if (pendingChanges.current) {
          // Caso C: usuário editou durante o carregamento — mantém local e sobe
          dataLoaded.current = true;
          return;
        }

        // Caso B: servidor tem dados → aplica no estado
        const { updated_at: _, ...rest } = serverData;
        const merged = { ...emptyData(), ...rest };
        lastServerTs.current = serverData.updated_at || null;

        setData(merged);
        saveLocal(username, merged);
        dataLoaded.current = true;
      })
      .catch((err) => {
        dataLoaded.current = true; // offline: usa localStorage, permite saves futuros
        console.warn('[AppContext] Offline — usando localStorage:', err.message);
      });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // ── POLLING — sincroniza entre dispositivos (cada 5s) ─────
  useEffect(() => {
    if (!username) return;

    const poll = async () => {
      if (pendingChanges.current || saveTimer.current) return;
      if (document.visibilityState === 'hidden') return;

      try {
        const serverData = await getDataRequest();
        if (!serverData) return;

        const serverTs    = serverData.updated_at;
        const serverTotal = countItems(serverData);
        const localTotal  = countItems(dataRef.current);

        const serverIsNewer = serverTs && lastServerTs.current && serverTs > lastServerTs.current;
        const serverHasMore = serverTotal > localTotal;

        if (!serverIsNewer && !serverHasMore) return;
        if (pendingChanges.current) return;

        const { updated_at: _, ...rest } = serverData;
        const merged = { ...emptyData(), ...rest };
        lastServerTs.current = serverTs;

        console.log(`[AppContext] 🔄 Polling: ${serverTotal} itens do servidor`);
        setData(merged);
        saveLocal(username, merged);
      } catch { /* silent */ }
    };

    const id = setInterval(poll, 5_000);
    const onVisible = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [username]);

  // ── SAVE DEBOUNCED — 400ms ────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!username) return;
    // Bloqueia save se o initialSync ainda não carregou E não há mudanças do usuário
    // Evita sobrescrever o servidor com estado vazio durante o boot
    if (!dataLoaded.current && !pendingChanges.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      saveTimer.current = null;
      const snapshot = dataRef.current;

      const { ok } = await saveWithRetry(snapshot);
      if (ok) {
        pendingChanges.current = false;
        lastServerTs.current   = new Date().toISOString();
      }
    }, 400);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, username]);

  // ── SAVE AO FECHAR / RECARREGAR (keepalive) ───────────────
  useEffect(() => {
    if (!username) return;
    const onBeforeUnload = () => {
      if (!pendingChanges.current && !saveTimer.current) return;
      const token = localStorage.getItem('lf_token');
      if (!token) return;
      try {
        fetch(`${apiBaseURL}/data`, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ data: dataRef.current }),
        });
      } catch { /* never fails */ }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [username]);

  // ── Mutador genérico ──────────────────────────────────────
  const update = useCallback((section, fn) => {
    pendingChanges.current = true;
    setData((prev) => ({ ...prev, [section]: fn(prev[section] || []) }));
  }, []);

  // ════════════════════════════════════════════════════════════
  //  Ações por domínio
  // ════════════════════════════════════════════════════════════

  const tasks             = data.tasks || [];
  const addTask           = (t)     => update('tasks', (a) => [{ ...t, id: genId(), createdAt: new Date().toISOString(), completed: false }, ...a]);
  const updateTask        = (id, u) => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteTask        = (id)    => update('tasks', (a) => a.filter((x) => x.id !== id));
  const toggleTask        = (id)    => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, completed: !x.completed } : x));

  const habits            = data.habits || [];
  const addHabit          = (h)  => update('habits', (a) => [...a, { ...h, id: genId(), streak: 0, completedDates: [] }]);
  const updateHabit       = (id, u) => update('habits', (a) => a.map((h) => h.id === id ? { ...h, ...u } : h));
  const deleteHabit       = (id) => update('habits', (a) => a.filter((h) => h.id !== id));
  const toggleHabit       = (id) => {
    const todayStr = today();
    update('habits', (hs) => hs.map((h) => {
      if (h.id !== id) return h;
      const done = h.completedDates.includes(todayStr);
      const completedDates = done ? h.completedDates.filter((d) => d !== todayStr) : [...h.completedDates, todayStr];
      let streak = 0;
      const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
      let cur = new Date(todayStr);
      for (const d of sorted) {
        const diff = Math.round((cur - new Date(d)) / 86400000);
        if (diff === 0 || diff === 1) { streak++; cur = new Date(d); } else break;
      }
      return { ...h, completedDates, streak };
    }));
  };

  const transactions      = data.transactions || [];
  const totalIncome       = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense      = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance           = totalIncome - totalExpense;
  // Preserva tx.date (data selecionada pelo usuário) — não sobrescreve com timestamp atual
  const addTransaction    = (tx) => update('transactions', (a) => [{ ...tx, id: genId(), createdAt: new Date().toISOString(), date: tx.date || new Date().toISOString().split('T')[0] }, ...a]);
  const updateTransaction = (id, u) => update('transactions', (a) => a.map((t) => t.id === id ? { ...t, ...u } : t));
  const deleteTransaction = (id) => update('transactions', (a) => a.filter((t) => t.id !== id));

  const studyItems        = data.studyItems || [];
  const addStudyItem      = (item) => update('studyItems', (a) => [{ ...item, id: genId(), progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateStudyItem   = (id, u) => update('studyItems', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteStudyItem   = (id)    => update('studyItems', (a) => a.filter((x) => x.id !== id));

  const notes             = data.notes || [];
  const addNote           = (n)     => update('notes', (a) => [{ ...n, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateNote        = (id, u) => update('notes', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteNote        = (id)    => update('notes', (a) => a.filter((x) => x.id !== id));

  const goals             = data.goals || [];
  const addGoal           = (g)     => update('goals', (a) => [{ ...g, id: genId(), createdAt: new Date().toISOString() }, ...a]);
  const updateGoal        = (id, u) => update('goals', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteGoal        = (id)    => update('goals', (a) => a.filter((x) => x.id !== id));

  const agenda            = data.agenda || [];
  const addEvent          = (ev)    => update('agenda', (a) => [...a, { ...ev, id: genId(), createdAt: new Date().toISOString() }]);
  const updateEvent       = (id, u) => update('agenda', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteEvent       = (id)    => update('agenda', (a) => a.filter((x) => x.id !== id));

  const cards             = data.cards || [];
  const addCard           = (c)     => update('cards', (a) => [...a, { ...c, id: genId(), createdAt: new Date().toISOString() }]);
  const updateCard        = (id, u) => update('cards', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteCard        = (id)    => update('cards', (a) => a.filter((x) => x.id !== id));

  return (
    <AppContext.Provider value={{
      tasks,        addTask,    updateTask,    deleteTask,    toggleTask,
      habits,       addHabit,   updateHabit,   deleteHabit,   toggleHabit,
      transactions, totalIncome, totalExpense, balance, addTransaction, updateTransaction, deleteTransaction,
      studyItems,   addStudyItem, updateStudyItem, deleteStudyItem,
      notes,        addNote,    updateNote,    deleteNote,
      goals,        addGoal,    updateGoal,    deleteGoal,
      agenda,       addEvent,   updateEvent,   deleteEvent,
      cards,        addCard,    updateCard,    deleteCard,
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
