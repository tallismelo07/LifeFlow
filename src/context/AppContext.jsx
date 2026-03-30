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
// ════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getDataRequest, saveDataRequest } from '../services/authService';
import { apiBaseURL } from '../services/api';

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const today = () => new Date().toISOString().split('T')[0];

// ── Campos que compõem os dados do usuário ───────────────────
const DATA_FIELDS = ['tasks', 'habits', 'transactions', 'studyItems', 'notes', 'goals', 'agenda'];

const emptyData = () => ({
  tasks: [], habits: [], transactions: [],
  studyItems: [], notes: [], goals: [], agenda: [],
});

// Conta total de itens em todas as coleções
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
      const result = await saveDataRequest(data);
      console.log(`[AppContext] ✓ Salvo no servidor (tentativa ${attempt}) total=${countItems(data)}`);
      return { ok: true, result };
    } catch (err) {
      console.warn(`[AppContext] ✗ Falha ao salvar (${attempt}/${maxAttempts}):`, err.message);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 800));
      }
    }
  }
  console.error('[AppContext] ✗✗ Falha persistente — dados no localStorage mas não no servidor');
  return { ok: false };
}

// ── Contexto ──────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const username = currentUser?.username;

  // Estado principal — inicializado do localStorage para UI instantânea
  const [data,      setData]      = useState(() => loadLocal(username));
  const [syncing,   setSyncing]   = useState(false);
  const [saveErr,   setSaveErr]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // ── Refs de controle de ciclo ─────────────────────────────
  const dataRef          = useRef(data);   // sempre aponta para o data mais recente
  const saveTimer        = useRef(null);
  const isFirstRender    = useRef(true);
  // Flag: true quando há mudanças locais ainda não confirmadas pelo servidor
  // Garante que o polling não sobrescreva edições em curso
  const pendingChanges   = useRef(false);
  // Guarda o timestamp ISO do último dado confirmado pelo servidor
  // Usado para saber se o servidor tem algo mais novo
  const lastServerTs     = useRef(null);
  // Previne que a sincronização inicial rode mais de uma vez por sessão
  const initialSyncDone  = useRef(false);

  // Mantém dataRef sempre atualizado com o state mais recente
  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Reset ao trocar de usuário ────────────────────────────
  useEffect(() => {
    // Cancela qualquer save em andamento do usuário anterior
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    // Reseta todos os controles
    isFirstRender.current   = true;
    pendingChanges.current  = false;
    lastServerTs.current    = null;
    initialSyncDone.current = false;

    const local = loadLocal(username);
    setData(local);
    dataRef.current = local;
    setSaveErr(false);
    setSyncing(false);
  }, [username]);

  // ── Persiste no localStorage a cada mudança de estado ─────
  // (segurança — garante que o cache local nunca fica desatualizado)
  useEffect(() => {
    if (username) saveLocal(username, data);
  }, [username, data]);

  // ── SINCRONIZAÇÃO INICIAL ─────────────────────────────────
  // Roda apenas uma vez por sessão de usuário.
  // Estratégia:
  //   A) Servidor vazio + local tem dados → upload de recuperação imediato
  //   B) Servidor tem dados + sem edições locais → aplica servidor
  //   C) Servidor tem dados + edições locais em andamento → mantém local
  //   D) Ambos vazios → nada a fazer
  useEffect(() => {
    if (!username || initialSyncDone.current) return;
    initialSyncDone.current = true;

    setSyncing(true);
    console.log('[AppContext] 🔄 Sincronização inicial...');

    getDataRequest()
      .then((serverData) => {
        if (!serverData) return;

        const serverTotal = countItems(serverData);
        const localData   = loadLocal(username); // lê do localStorage (mais fresco que state)
        const localTotal  = countItems(localData);

        console.log(`[AppContext] Servidor: ${serverTotal} itens  |  Local: ${localTotal} itens`);

        // ── CASO A: servidor perdeu dados, local tem ──────────
        // Acontece quando o Render reinicia e recria o banco vazio.
        // Solução: faz upload do localStorage para recuperar os dados.
        if (serverTotal === 0 && localTotal > 0) {
          console.log('[AppContext] ⚠ Servidor vazio mas local tem dados — fazendo upload de recuperação');
          saveWithRetry(localData).then(({ ok }) => {
            if (ok) {
              lastServerTs.current = new Date().toISOString();
              pendingChanges.current = false;
              setSaveErr(false);
            } else {
              setSaveErr(true);
            }
          });
          // Estado já tem os dados locais — não muda nada visualmente
          return;
        }

        // ── CASO D: ambos vazios ──────────────────────────────
        if (serverTotal === 0 && localTotal === 0) {
          console.log('[AppContext] ℹ Servidor e local vazios — novo usuário');
          lastServerTs.current = serverData.updated_at || null;
          return;
        }

        // ── CASO C: edições locais em curso ───────────────────
        // O usuário editou dados ANTES do servidor responder
        // (cold start lento do Render, por exemplo).
        // Mantém os dados locais — o debounce vai salvar em breve.
        if (pendingChanges.current) {
          console.log('[AppContext] ℹ Edições locais em curso — ignorando servidor');
          return;
        }

        // ── CASO B: servidor tem dados, sem edições locais ────
        // Servidor é a fonte de verdade. Aplica.
        const { updated_at: _, ...rest } = serverData;
        const merged = { ...emptyData(), ...rest };
        lastServerTs.current = serverData.updated_at || null;

        console.log('[AppContext] ✓ Dados do servidor aplicados:', {
          tasks:        merged.tasks.length,
          habits:       merged.habits.length,
          notes:        merged.notes.length,
          goals:        merged.goals.length,
          agenda:       merged.agenda.length,
          studyItems:   merged.studyItems.length,
          transactions: merged.transactions.length,
        });

        // Aplica sem disparar o save useEffect para o servidor
        // (isFirstRender ainda está true, então o useEffect pula)
        setData(merged);
        saveLocal(username, merged); // atualiza cache local com dado do servidor
      })
      .catch((err) => {
        console.warn('[AppContext] Servidor inacessível — usando localStorage:', err.message);
        // Modo offline: localStorage continua sendo a fonte enquanto o servidor não responde
      })
      .finally(() => setSyncing(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // ── POLLING — sincroniza entre dispositivos ───────────────
  // A cada 5s, busca dados do servidor.
  // SÓ aplica se:
  //   1. Não há edições locais pendentes (pendingChanges = false)
  //   2. O servidor tem algo mais recente (via updated_at)
  //   3. O servidor tem MAIS itens que o local (proteção extra)
  useEffect(() => {
    if (!username) return;

    const poll = async () => {
      // Não poleia se há edições locais não salvas
      if (pendingChanges.current) return;
      // Não poleia se há um save em andamento
      if (saveTimer.current) return;
      // Não poleia se a aba está oculta (economiza bateria/rede em mobile)
      if (document.visibilityState === 'hidden') return;

      try {
        const serverData = await getDataRequest();
        if (!serverData) return;

        const serverTs    = serverData.updated_at;
        const serverTotal = countItems(serverData);
        const localTotal  = countItems(dataRef.current);

        // Decide se aplica: servidor mais recente OU servidor tem mais itens
        const serverIsNewer = serverTs && lastServerTs.current && serverTs > lastServerTs.current;
        const serverHasMore = serverTotal > localTotal;

        if (!serverIsNewer && !serverHasMore) return;

        // Última verificação: não aplica se vieram edições locais durante o fetch
        if (pendingChanges.current) return;

        const { updated_at: _, ...rest } = serverData;
        const merged = { ...emptyData(), ...rest };
        lastServerTs.current = serverTs;

        console.log(`[AppContext] 🔄 Polling aplicado: ${serverTotal} itens do servidor`);
        setData(merged);
        saveLocal(username, merged);
      } catch {
        // Silent fail — rede pode estar indisponível
      }
    };

    const intervalId = setInterval(poll, 5_000);
    // Escuta visibilitychange para sincronizar quando o usuário volta à aba
    const onVisible = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [username]);

  // ── SAVE DEBOUNCED — 400ms após última mudança local ──────
  useEffect(() => {
    // Pula o render inicial (dados vieram do localStorage, não de ação do usuário)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!username) return;

    // Cancela o save anterior (debounce)
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      saveTimer.current = null;

      const snapshot = dataRef.current; // captura o estado atual no momento do disparo
      console.log(`[AppContext] Salvando ${countItems(snapshot)} itens no servidor...`);

      setSaving(true);
      const { ok } = await saveWithRetry(snapshot);
      setSaving(false);
      setSaveErr(!ok);

      if (ok) {
        pendingChanges.current = false;
        lastServerTs.current   = new Date().toISOString();
        setLastSaved(new Date());
      }
    }, 400);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, username]);

  // ── SAVE NO FECHAMENTO / REFRESH DA PÁGINA ────────────────
  // fetch com keepalive = único método garantido pelo browser ao fechar/recarregar
  // Resolve: usuário cria item → fecha em menos de 400ms → item sumia
  useEffect(() => {
    if (!username) return;

    const onBeforeUnload = () => {
      // Só envia se há mudanças pendentes (evita request desnecessário)
      if (!pendingChanges.current && !saveTimer.current) return;

      const token = localStorage.getItem('lf_token');
      if (!token) return;

      console.log('[AppContext] beforeunload — salvando via keepalive');
      try {
        fetch(`${apiBaseURL}/data`, {
          method:    'POST',
          keepalive: true,   // ← garante que o request completa mesmo após unload
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ data: dataRef.current }),
        });
      } catch { /* nunca falha */ }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [username]);

  // ── Mutador genérico (puro — sem side-effects) ────────────
  // Atualiza o estado e marca que há mudanças pendentes para o servidor.
  const update = useCallback((section, fn) => {
    pendingChanges.current = true;
    setData((prev) => ({
      ...prev,
      [section]: fn(prev[section] || []),
    }));
  }, []);

  // ════════════════════════════════════════════════════════════
  //  Ações por domínio
  // ════════════════════════════════════════════════════════════

  // ── Tasks ────────────────────────────────────────────────
  const tasks      = data.tasks      || [];
  const addTask    = (t)     => update('tasks', (a) => [{ ...t, id: genId(), createdAt: new Date().toISOString(), completed: false }, ...a]);
  const updateTask = (id, u) => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteTask = (id)    => update('tasks', (a) => a.filter((x) => x.id !== id));
  const toggleTask = (id)    => update('tasks', (a) => a.map((x) => x.id === id ? { ...x, completed: !x.completed } : x));

  // ── Habits ───────────────────────────────────────────────
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
      let cur = new Date(todayStr);
      for (const d of sorted) {
        const diff = Math.round((cur - new Date(d)) / 86400000);
        if (diff === 0 || diff === 1) { streak++; cur = new Date(d); } else break;
      }
      return { ...h, completedDates, streak };
    }));
  };

  // ── Finance ──────────────────────────────────────────────
  const transactions      = data.transactions || [];
  const totalIncome       = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense      = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance           = totalIncome - totalExpense;
  const addTransaction    = (tx) => update('transactions', (a) => [{ ...tx, id: genId(), date: new Date().toISOString() }, ...a]);
  const deleteTransaction = (id) => update('transactions', (a) => a.filter((t) => t.id !== id));

  // ── Study ────────────────────────────────────────────────
  const studyItems      = data.studyItems || [];
  const addStudyItem    = (item) => update('studyItems', (a) => [{ ...item, id: genId(), progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateStudyItem = (id, u) => update('studyItems', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteStudyItem = (id)    => update('studyItems', (a) => a.filter((x) => x.id !== id));

  // ── Notes ────────────────────────────────────────────────
  const notes      = data.notes || [];
  const addNote    = (n)     => update('notes', (a) => [{ ...n, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...a]);
  const updateNote = (id, u) => update('notes', (a) => a.map((x) => x.id === id ? { ...x, ...u, updatedAt: new Date().toISOString() } : x));
  const deleteNote = (id)    => update('notes', (a) => a.filter((x) => x.id !== id));

  // ── Goals ────────────────────────────────────────────────
  const goals      = data.goals || [];
  const addGoal    = (g)     => update('goals', (a) => [{ ...g, id: genId(), createdAt: new Date().toISOString() }, ...a]);
  const updateGoal = (id, u) => update('goals', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteGoal = (id)    => update('goals', (a) => a.filter((x) => x.id !== id));

  // ── Agenda ───────────────────────────────────────────────
  const agenda      = data.agenda || [];
  const addEvent    = (ev)    => update('agenda', (a) => [...a, { ...ev, id: genId(), createdAt: new Date().toISOString() }]);
  const updateEvent = (id, u) => update('agenda', (a) => a.map((x) => x.id === id ? { ...x, ...u } : x));
  const deleteEvent = (id)    => update('agenda', (a) => a.filter((x) => x.id !== id));

  // ── Navegação ────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppContext.Provider value={{
      syncing,
      saveErr,
      saving,
      lastSaved,
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
