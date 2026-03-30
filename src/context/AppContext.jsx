// src/context/AppContext.jsx
// Dados do usuário — offline-first com sincronização confiável
//
// Fluxo correto:
//  1. Init: carrega localStorage (UI instantânea)
//  2. Mount: GET /api/data — servidor é fonte de verdade (se mais recente)
//  3. Toda mutação: atualiza state + marca lastModifiedAt
//  4. useEffect debounced 500ms: POST /api/data com retry automático
//  5. beforeunload: fetch keepalive garante save mesmo em refresh rápido
//  6. Polling 30s: sincroniza dados criados em outros dispositivos

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getDataRequest, saveDataRequest } from '../services/authService';
import { apiBaseURL } from '../services/api';

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
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  return false;
}

// Aplica dados do servidor ao estado, respeitando mudanças locais não salvas
// serverTs: timestamp epoch do dado do servidor
// localModifiedAt: timestamp epoch da última mudança local
function mergeWithServer(serverData, localModifiedAt) {
  const serverTs = serverData.updated_at
    ? new Date(serverData.updated_at).getTime()
    : 0;

  // Separa o campo updated_at dos dados reais
  const { updated_at: _, ...rest } = serverData;
  const merged = { ...emptyData(), ...rest };

  return { merged, serverTs, shouldApply: serverTs >= localModifiedAt };
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const username = currentUser?.username;

  const [data,    setData]    = useState(() => loadLocal(username));
  const [syncing, setSyncing] = useState(false);
  const [saveErr, setSaveErr] = useState(false);

  // Refs de controle
  const serverSynced   = useRef(false);
  const saveTimer      = useRef(null);
  const isFirstRender  = useRef(true);
  const lastModifiedAt = useRef(0);   // epoch ms da última mudança LOCAL
  const dataRef        = useRef(data); // sempre aponta para o data mais recente (para beforeunload)

  // Mantém dataRef sincronizado
  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Reseta ao trocar de usuário ─────────────────────────────
  useEffect(() => {
    serverSynced.current  = false;
    isFirstRender.current = true;
    lastModifiedAt.current = 0;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setData(loadLocal(username));
    setSaveErr(false);
  }, [username]);

  // ── Persiste no localStorage a cada mudança ─────────────────
  useEffect(() => {
    if (username) saveLocal(username, data);
  }, [username, data]);

  // ── SINCRONIZAÇÃO INICIAL — servidor é a fonte de verdade ───
  useEffect(() => {
    if (!username) return;

    setSyncing(true);
    console.log('[AppContext] Buscando dados do servidor...');

    getDataRequest()
      .then((serverData) => {
        if (!serverData) return;

        const { merged, serverTs, shouldApply } = mergeWithServer(serverData, lastModifiedAt.current);

        if (!shouldApply && lastModifiedAt.current > 0) {
          // Usuário já editou dados enquanto o servidor carregava (ex: Render cold start)
          // Mantém os dados locais — o debounce vai salvar em breve
          console.log('[AppContext] ℹ Local é mais recente — mantendo dados locais', {
            local: new Date(lastModifiedAt.current).toISOString(),
            server: serverData.updated_at,
          });
          serverSynced.current = true;
          return;
        }

        console.log('[AppContext] ✓ Aplicando dados do servidor', {
          tasks:        merged.tasks.length,
          habits:       merged.habits.length,
          notes:        merged.notes.length,
          goals:        merged.goals.length,
          agenda:       merged.agenda.length,
          studyItems:   merged.studyItems.length,
          transactions: merged.transactions.length,
          serverTs:     new Date(serverTs).toISOString(),
        });

        setData(merged);
        saveLocal(username, merged);
        serverSynced.current = true;
      })
      .catch((err) => {
        console.warn('[AppContext] Servidor inacessível, usando localStorage:', err.message);
        serverSynced.current = false;
      })
      .finally(() => setSyncing(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // ── POLLING — sincronização entre dispositivos (a cada 30s) ─
  useEffect(() => {
    if (!username) return;

    const poll = async () => {
      // Não faz poll se há save pendente (timer ativo) — evita conflito
      if (saveTimer.current) return;

      try {
        const serverData = await getDataRequest();
        if (!serverData) return;

        const { merged, serverTs } = mergeWithServer(serverData, lastModifiedAt.current);

        // Só atualiza se o servidor tem dados mais recentes que nossa última edição
        if (serverTs > lastModifiedAt.current) {
          console.log('[AppContext] 🔄 Polling: dados mais recentes no servidor — sincronizando');
          setData(merged);
          saveLocal(username, merged);
        }
      } catch {
        // Silent fail — rede pode estar indisponível
      }
    };

    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [username]);

  // ── SAVE DEBOUNCED — 500ms após última mutação ───────────────
  useEffect(() => {
    // Pula o primeiro render (dados vieram do localStorage, não do usuário)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!username) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      saveTimer.current = null; // limpa ref antes do save (libera polling)
      console.log('[AppContext] Salvando dados no servidor...', { username });
      const ok = await saveWithRetry(dataRef.current);
      setSaveErr(!ok);
      if (!ok) {
        console.error('[AppContext] ✗ Falha persistente ao salvar. Dados estão no localStorage.');
      }
    }, 500);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        // NÃO zeramos saveTimer.current no cleanup — o beforeunload verifica isso
      }
    };
  }, [data, username]);

  // ── SAVE NO FECHAMENTO DA PÁGINA (beforeunload) ──────────────
  // Usa fetch com keepalive — único método confiável para salvar ao fechar/refresh
  // Isso resolve o caso: usuário cria dado → fecha antes de 500ms → dado sumia
  useEffect(() => {
    if (!username) return;

    const handleBeforeUnload = () => {
      const token = localStorage.getItem('lf_token');
      if (!token) return;

      console.log('[AppContext] beforeunload — salvando via fetch keepalive');
      fetch(`${apiBaseURL}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: dataRef.current }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [username]);

  // ── Mutador genérico ─────────────────────────────────────────
  // Marca lastModifiedAt para que o server sync não sobrescreva
  const update = useCallback((section, fn) => {
    lastModifiedAt.current = Date.now();
    setData((prev) => ({
      ...prev,
      [section]: fn(prev[section] || []),
    }));
  }, []);

  // ── Tasks ────────────────────────────────────────────────────
  const tasks      = data.tasks      || [];
  const addTask    = (t)     => update('tasks', (a) => [{ ...t, id: genId(), createdAt: new Date().toISOString(), completed: false }, ...a]);
  const updateTask = (id, u) => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteTask = (id)    => update('tasks', (a) => a.filter((x) => x.id !== id));
  const toggleTask = (id)    => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, completed: !x.completed } : x));

  // ── Habits ───────────────────────────────────────────────────
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

  // ── Finance ──────────────────────────────────────────────────
  const transactions      = data.transactions || [];
  const totalIncome       = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense      = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance           = totalIncome - totalExpense;
  const addTransaction    = (tx) => update('transactions', (a) => [{ ...tx, id: genId(), date: new Date().toISOString() }, ...a]);
  const deleteTransaction = (id) => update('transactions', (a) => a.filter((t) => t.id !== id));

  // ── Study ────────────────────────────────────────────────────
  const studyItems      = data.studyItems || [];
  const addStudyItem    = (item) => update('studyItems', (a) => [{ ...item, id: genId(), progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateStudyItem = (id, u) => update('studyItems', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteStudyItem = (id)    => update('studyItems', (a) => a.filter((x) => x.id !== id));

  // ── Notes ────────────────────────────────────────────────────
  const notes      = data.notes || [];
  const addNote    = (n)     => update('notes', (a) => [{ ...n, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateNote = (id, u) => update('notes', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteNote = (id)    => update('notes', (a) => a.filter((x) => x.id !== id));

  // ── Goals ────────────────────────────────────────────────────
  const goals      = data.goals || [];
  const addGoal    = (g)     => update('goals', (a) => [{ ...g, id: genId(), createdAt: new Date().toISOString() }, ...a]);
  const updateGoal = (id, u) => update('goals', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteGoal = (id)    => update('goals', (a) => a.filter((x) => x.id !== id));

  // ── Agenda ───────────────────────────────────────────────────
  const agenda      = data.agenda || [];
  const addEvent    = (ev)    => update('agenda', (a) => [...a, { ...ev, id: genId(), createdAt: new Date().toISOString() }]);
  const updateEvent = (id, u) => update('agenda', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteEvent = (id)    => update('agenda', (a) => a.filter((x) => x.id !== id));

  // ── Nav ──────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppContext.Provider value={{
      syncing,
      saveErr,
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
