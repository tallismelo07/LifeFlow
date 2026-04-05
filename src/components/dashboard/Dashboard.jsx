// src/components/dashboard/Dashboard.jsx — v3
// Dashboard geral + versão financeira exclusiva para Tallis
import { motion } from 'framer-motion';
import { useApp }  from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNav }  from '../../context/NavContext';
import CatMascot   from '../ui/CatMascot';
import {
  CheckSquare, Flame, TrendingUp, TrendingDown, DollarSign,
  Target, ArrowRight, Circle, CheckCircle2, Calendar, Clock, Wallet,
  AlertTriangle, ThumbsUp, Minus,
} from 'lucide-react';

// ── Formatadores ──────────────────────────────────────────────
const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

// ── Motion variants ───────────────────────────────────────────
const container = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp    = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' } },
};

// ── Componentes internos ──────────────────────────────────────

function Card({ children, className = '', hover = false }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      whileHover={hover ? { y: -2 } : undefined}
    >
      {children}
    </motion.div>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 6, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-muted)', flex: 1 }}>
      <motion.div
        style={{ height: '100%', borderRadius: 99, backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  );
}

// Cartão de stat (mini) — totalmente responsivo
function MiniStat({ label, value, sub, color, Icon }) {
  return (
    <motion.div
      variants={fadeUp}
      className="card"
      style={{ padding: '14px 16px', minWidth: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)' }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, lineHeight: 1.3 }}>{sub}</p>}
    </motion.div>
  );
}

// ── Saúde financeira ──────────────────────────────────────────

function FinanceHealth({ income, expense, balance }) {
  let message, Icon, color, bg, border;

  const savingRate = income > 0 ? ((income - expense) / income) * 100 : null;

  if (income === 0 && expense === 0) {
    message = 'Nenhuma movimentação este mês.';
    Icon    = Minus;
    color   = 'var(--text-4)';
    bg      = 'var(--bg-muted)';
    border  = 'var(--border)';
  } else if (expense > income) {
    message = `Você gastou ${fmt(expense - income)} a mais do que recebeu este mês.`;
    Icon    = AlertTriangle;
    color   = 'var(--red)';
    bg      = 'var(--red-bg)';
    border  = 'var(--red-border)';
  } else if (savingRate !== null && savingRate >= 20) {
    message = `Você está economizando ${Math.round(savingRate)}% da sua renda. Excelente!`;
    Icon    = ThumbsUp;
    color   = 'var(--green)';
    bg      = 'var(--green-bg)';
    border  = 'var(--green-border)';
  } else {
    message = `Saldo positivo de ${fmt(balance)} este mês.`;
    Icon    = TrendingUp;
    color   = 'var(--teal)';
    bg      = 'rgba(91,188,170,0.08)';
    border  = 'rgba(91,188,170,0.2)';
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 14, padding: '12px 14px',
    }}>
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 13, color, fontWeight: 500, lineHeight: 1.4 }}>{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TALLIS DASHBOARD — Foco financeiro
// ═══════════════════════════════════════════════════════════════

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function TallisDashboard() {
  const { transactions } = useApp();
  const { setActiveTab }  = useNav();

  const now              = new Date();
  const currentMonthKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName        = `${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;

  // Mês atual
  const monthTxs   = (transactions || []).filter((t) => (t.date || t.createdAt || '').slice(0, 7) === currentMonthKey);
  const income     = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expense    = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance    = income - expense;

  // Percentual gasto da renda
  const spentPct   = income > 0 ? Math.round((expense / income) * 100) : null;
  const isPositive = balance >= 0;

  // Últimos 3 meses (histórico)
  const last3 = Array.from({ length: 3 }, (_, i) => {
    const d    = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const txs  = (transactions || []).filter((t) => (t.date || t.createdAt || '').slice(0, 7) === key);
    return {
      label:   MONTHS_PT[d.getMonth()],
      income:  txs.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0),
      expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0),
    };
  });

  // Top 3 categorias de gasto do mês
  const catMap = {};
  monthTxs.filter((t) => t.type === 'expense').forEach((t) => {
    catMap[t.category || 'outro'] = (catMap[t.category || 'outro'] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const CAT_LABELS = {
    alimentacao: 'Alimentação', assinatura: 'Assinatura', curso: 'Curso',
    salario: 'Salário', freelancer: 'Freelancer', saude: 'Saúde',
    transporte: 'Transporte', moradia: 'Moradia', lazer: 'Lazer', outro: 'Outro',
  };

  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const maxBar = Math.max(...last3.flatMap((m) => [m.income, m.expense]), 1);

  return (
    <motion.div
      style={{ padding: '24px 20px 60px', maxWidth: 720, margin: '0 auto' }}
      variants={container} initial="initial" animate="animate"
    >
      {/* ── Saudação ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 4 }}>
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {greeting}, Tallis
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>Resumo financeiro de {monthName}</p>
      </motion.div>

      {/* ── Saldo hero ────────────────────────────────────── */}
      <motion.div variants={fadeUp} style={{
        background: '#ffffff', border: `2px solid ${isPositive ? 'var(--green-border)' : 'var(--red-border)'}`,
        borderRadius: 20, padding: '28px 24px', marginBottom: 16, textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--text-4)', marginBottom: 8 }}>
          Saldo em {monthName}
        </p>
        <motion.p
          style={{ fontSize: 'clamp(32px,6vw,42px)', fontWeight: 800,
            color: isPositive ? 'var(--green)' : 'var(--red)',
            letterSpacing: '-0.03em', lineHeight: 1 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {fmt(balance)}
        </motion.p>

        {/* Status badge */}
        <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 99,
          background: isPositive ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${isPositive ? 'var(--green-border)' : 'var(--red-border)'}` }}>
          {isPositive
            ? <ThumbsUp size={13} style={{ color: 'var(--green)' }} />
            : <AlertTriangle size={13} style={{ color: 'var(--red)' }} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: isPositive ? 'var(--green)' : 'var(--red)' }}>
            {isPositive ? 'Saldo positivo' : 'Saldo negativo'}
          </span>
        </div>
      </motion.div>

      {/* ── Entradas / Saídas ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Entradas', value: income,  Icon: TrendingUp,   color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)' },
          { label: 'Saídas',   value: expense, Icon: TrendingDown, color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)'   },
        ].map(({ label, value, Icon, color, bg, border }) => (
          <motion.div key={label} variants={fadeUp} style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: 16, padding: '18px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon size={15} style={{ color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{label}</span>
            </div>
            <p style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color, letterSpacing: '-0.01em' }}>
              {fmt(value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Você gastou X% da renda ───────────────────────── */}
      {income > 0 && (
        <motion.div variants={fadeUp} style={{
          background: '#ffffff', border: '1px solid var(--border-md)',
          borderRadius: 16, padding: '18px 20px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>
              Você gastou{' '}
              <strong style={{ color: spentPct > 100 ? 'var(--red)' : spentPct > 80 ? 'var(--amber)' : 'var(--green)' }}>
                {spentPct}%
              </strong>
              {' '}da sua renda
            </p>
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{monthName}</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spentPct, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              style={{
                height: '100%', borderRadius: 99,
                background: spentPct > 100 ? 'var(--red)' : spentPct > 80 ? 'var(--amber)' : 'var(--green)',
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>
            {spentPct <= 70
              ? '✓ Ótimo controle de gastos!'
              : spentPct <= 90
              ? 'Atenção: você usou a maior parte da renda.'
              : '⚠ Você gastou quase toda (ou mais) da renda.'}
          </p>
        </motion.div>
      )}

      {/* ── Linha 2: Top categorias + Histórico ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}
        className="lg:grid-cols-2">

        {/* Top categorias */}
        <motion.div variants={fadeUp} style={{
          background: '#ffffff', border: '1px solid var(--border-md)',
          borderRadius: 16, padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Principais gastos</h3>
            <button onClick={() => setActiveTab('finance')}
              style={{ fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver tudo <ArrowRight size={11} />
            </button>
          </div>
          {topCats.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-4)', textAlign: 'center', padding: '12px 0' }}>
              Sem gastos registrados
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCats.map(([cat, total], i) => {
                const pct = expense > 0 ? Math.round((total / expense) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                        {CAT_LABELS[cat] || cat}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {fmt(total)} <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 * i }}
                        style={{ height: '100%', background: 'var(--text)', opacity: 0.7 - i * 0.15, borderRadius: 99 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Histórico 3 meses */}
        <motion.div variants={fadeUp} style={{
          background: '#ffffff', border: '1px solid var(--border-md)',
          borderRadius: 16, padding: '20px',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Últimos 3 meses</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 90, marginBottom: 12 }}>
            {last3.map(({ label: lbl, income: inc, expense: exp }) => (
              <div key={lbl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 70 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(inc / maxBar) * 70}px` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ width: 14, background: 'var(--green)', borderRadius: '4px 4px 2px 2px', opacity: 0.8, minHeight: inc > 0 ? 3 : 0 }}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(exp / maxBar) * 70}px` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
                    style={{ width: 14, background: 'var(--red)', borderRadius: '4px 4px 2px 2px', opacity: 0.8, minHeight: exp > 0 ? 3 : 0 }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{lbl}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[{ label: 'Entradas', color: 'var(--green)' }, { label: 'Saídas', color: 'var(--red)' }].map(({ label: lbl, color }) => (
              <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
                <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />
                {lbl}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Link para financeiro completo ──────────────────── */}
      <motion.button
        variants={fadeUp}
        onClick={() => setActiveTab('finance')}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: 'var(--text)', color: '#ffffff', border: 'none',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Wallet size={16} />
        Abrir controle financeiro completo
        <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Dashboard() {
  const { tasks, habits, transactions, goals, agenda } = useApp();
  const { currentUser } = useAuth();
  const { setActiveTab } = useNav();

  // Tallis tem dashboard exclusivamente financeiro
  if (currentUser?.username === 'tallis') return <TallisDashboard />;

  const todayStr = new Date().toISOString().split('T')[0];
  const now      = new Date();
  const MONTHS   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // ── Financeiro do MÊS ATUAL ───────────────────────────────
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTxs    = (transactions || []).filter((t) => (t.date || t.createdAt || '').slice(0, 7) === currentMonthKey);
  const monthIncome  = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const monthExpense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const monthBalance = monthIncome - monthExpense;
  const monthName    = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // ── Tarefas ───────────────────────────────────────────────
  const normalizedTasks = (tasks || []).map((t) => ({ ...t, status: t.status || (t.completed ? 'done' : 'todo') }));
  const doneTasks  = normalizedTasks.filter((t) => t.status === 'done').length;
  const totalTasks = normalizedTasks.length;
  const taskPct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const urgentTasks = normalizedTasks.filter((t) => t.status !== 'done' && t.priority === 'high').slice(0, 4);

  // ── Hábitos ───────────────────────────────────────────────
  const habitsToday = (habits || []).filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const habitTotal  = (habits || []).length;
  const habitPct    = habitTotal > 0 ? Math.round((habitsToday / habitTotal) * 100) : 0;
  const todayHabits = (habits || []).slice(0, 5);

  // ── Progresso geral ───────────────────────────────────────
  const overallPct = Math.round((taskPct + habitPct) / 2);

  // ── Agenda ────────────────────────────────────────────────
  const todayEvents = (agenda || [])
    .filter((e) => e.date?.startsWith(todayStr))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  // ── Metas ─────────────────────────────────────────────────
  const topGoals = [...(goals || [])]
    .filter((g) => g.current < g.target)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))
    .slice(0, 3);

  // ── Saudação ──────────────────────────────────────────────
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const isYasmin = currentUser?.username === 'yasmin';

  // ── Progresso de gastos no mês ────────────────────────────
  const spentPct = monthIncome > 0 ? Math.min(100, Math.round((monthExpense / monthIncome) * 100)) : 0;

  return (
    <motion.div
      style={{ padding: '20px 16px', maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}
      variants={container}
      initial="initial"
      animate="animate"
    >
      {/* ── Saudação ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 4, textTransform: 'capitalize' }}>
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
          {greeting},{' '}
          <span style={{ color: 'var(--accent-light)' }}>{currentUser?.name}</span>!
        </h2>
      </motion.div>

      {/* ── Stats 4-up ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 16,
      }}
        className="lg:grid-cols-4"
      >
        <MiniStat
          label="SALDO"
          value={fmt(monthBalance)}
          sub={monthName}
          color={monthBalance >= 0 ? 'var(--green)' : 'var(--red)'}
          Icon={DollarSign}
        />
        <MiniStat
          label="TAREFAS"
          value={`${doneTasks}/${totalTasks}`}
          sub={`${taskPct}% concluídas`}
          color="var(--blue)"
          Icon={CheckSquare}
        />
        <MiniStat
          label="HÁBITOS"
          value={`${habitsToday}/${habitTotal}`}
          sub={`${habitPct}% hoje`}
          color="var(--teal)"
          Icon={Flame}
        />
        <MiniStat
          label="METAS"
          value={`${topGoals.length}`}
          sub="em progresso"
          color="var(--amber)"
          Icon={Target}
        />
      </div>

      {/* ── Linha 2: Urgente + Progresso ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}
        className="lg:grid-cols-3-2-1"
      >
        {/* Tarefas urgentes */}
        <Card style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Tarefas Urgentes</h3>
            <button
              onClick={() => setActiveTab('tasks')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-light)', cursor: 'pointer' }}
            >
              Ver todas <ArrowRight size={11} />
            </button>
          </div>
          {urgentTasks.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', justifyContent: 'center', color: 'var(--text-3)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: 13 }}>Nenhuma tarefa urgente 🎉</span>
            </div>
          ) : urgentTasks.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 12, marginBottom: 8,
                background: 'var(--bg-muted)', border: '1px solid var(--border)',
              }}
            >
              <Circle size={13} style={{ color: 'var(--red)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                {t.description && (
                  <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</p>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)',
              }}>URGENTE</span>
            </motion.div>
          ))}
        </Card>

        {/* Progresso */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Progresso do Dia</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Tarefas', value: taskPct,  color: 'var(--blue)' },
              { label: 'Hábitos', value: habitPct, color: 'var(--teal)' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
                </div>
                <ProgressBar value={value} color={color} />
              </div>
            ))}
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)', marginBottom: 10 }}>GERAL</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.span
                  style={{ fontSize: 34, fontWeight: 800, color: 'var(--green)', lineHeight: 1, flexShrink: 0 }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  {overallPct}%
                </motion.span>
                <ProgressBar value={overallPct} color="var(--green)" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Linha 3: Hábitos + Agenda ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}
        className="lg:grid-cols-2"
      >
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Hábitos de Hoje</h3>
            <button onClick={() => setActiveTab('habits')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--teal)', cursor: 'pointer' }}>
              Ver <ArrowRight size={11} />
            </button>
          </div>
          {todayHabits.length === 0 ? (
            <p style={{ fontSize: 13, textAlign: 'center', padding: '16px 0', color: 'var(--text-4)' }}>Nenhum hábito cadastrado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayHabits.map((h, i) => {
                const done = (h.completedDates || []).includes(todayStr);
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 12, border: '1px solid',
                      background: done ? 'var(--green-bg)' : 'var(--bg-muted)',
                      borderColor: done ? 'var(--green-border)' : 'var(--border)',
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon || '✨'}</span>
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 500,
                      color: 'var(--text)', textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.5 : 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {h.name}
                    </span>
                    {h.streak > 0 && <span style={{ fontSize: 11, color: 'var(--amber)', flexShrink: 0 }}>🔥{h.streak}</span>}
                    {done
                      ? <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
                      : <Circle size={15} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                    }
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Agenda de Hoje</h3>
            <button onClick={() => setActiveTab('tasks')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-light)', cursor: 'pointer' }}>
              Ver <ArrowRight size={11} />
            </button>
          </div>
          {todayEvents.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', justifyContent: 'center', color: 'var(--text-4)' }}>
              <Calendar size={17} />
              <span style={{ fontSize: 13 }}>Sem eventos hoje</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayEvents.map((ev, i) => (
                <motion.div key={ev.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', borderRadius: 12,
                    border: `1px solid ${(ev.color || 'var(--blue)') + '30'}`,
                    background: (ev.color || 'var(--bg-muted)') + '0D',
                  }}
                >
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: ev.color || 'var(--blue)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                    <p style={{ fontSize: 11, color: ev.color || 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />
                      {fmtTime(ev.date)}{ev.endTime ? ` – ${ev.endTime}` : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Linha 4: Financeiro + Metas ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}
        className="lg:grid-cols-2"
      >
        {/* Financeiro do mês */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Financeiro</h3>
              <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{monthName}</p>
            </div>
            <button onClick={() => setActiveTab('finance')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-light)', cursor: 'pointer' }}>
              Ver <ArrowRight size={11} />
            </button>
          </div>

          {/* Saldo hero */}
          <div style={{
            background: monthBalance >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${monthBalance >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
            borderRadius: 14, padding: '16px', marginBottom: 12, textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Wallet size={13} style={{ color: 'var(--text-3)' }} />
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)' }}>SALDO DO MÊS</p>
            </div>
            <motion.p
              style={{ fontSize: 28, fontWeight: 800, color: monthBalance >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-0.02em' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              {fmt(monthBalance)}
            </motion.p>
          </div>

          {/* Entradas / Saídas — empilhados em mobile, lado a lado em md+ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TrendingUp size={12} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>Entradas</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', wordBreak: 'break-word' }}>{fmt(monthIncome)}</p>
            </div>
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TrendingDown size={12} style={{ color: 'var(--red)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>Saídas</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', wordBreak: 'break-word' }}>{fmt(monthExpense)}</p>
            </div>
          </div>

          {/* Barra de progresso de gastos */}
          {monthIncome > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Gastos vs. receita</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: spentPct > 100 ? 'var(--red)' : spentPct > 80 ? 'var(--amber)' : 'var(--green)' }}>
                  {spentPct}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(spentPct, 100)}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
                  style={{
                    height: '100%', borderRadius: 99,
                    background: spentPct > 100 ? 'var(--red)' : spentPct > 80 ? 'var(--amber)' : 'var(--green)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Status de saúde */}
          <FinanceHealth income={monthIncome} expense={monthExpense} balance={monthBalance} />
        </Card>

        {/* Metas */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Metas em Progresso</h3>
            <button onClick={() => setActiveTab('goals')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--amber)', cursor: 'pointer' }}>
              Ver <ArrowRight size={11} />
            </button>
          </div>
          {topGoals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-4)' }}>
              <Target size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Nenhuma meta em progresso</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topGoals.map((g, i) => {
                const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100));
                return (
                  <motion.div key={g.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{g.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: g.color || 'var(--amber)', flexShrink: 0 }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={g.color || 'var(--amber)'} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {isYasmin && <CatMascot />}
    </motion.div>
  );
}
