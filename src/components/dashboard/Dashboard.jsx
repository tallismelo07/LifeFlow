// src/components/dashboard/Dashboard.jsx
import { motion } from 'framer-motion';
import { useApp }  from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../ui';
import CatMascot   from '../ui/CatMascot';
import {
  CheckSquare, Flame, TrendingUp, TrendingDown, DollarSign,
  Target, ArrowRight, Circle, CheckCircle2, Calendar, Clock, Wallet,
} from 'lucide-react';

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

function ProgressRow({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: 'var(--text-3)' }}>{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      variants={item}
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      whileHover={hover ? { y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const { tasks, habits, balance, totalIncome, totalExpense, goals, agenda, setActiveTab } = useApp();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const normalizedTasks = tasks.map((t) => ({ ...t, status: t.status || (t.completed ? 'done' : 'todo') }));
  const doneTasks  = normalizedTasks.filter((t) => t.status === 'done').length;
  const totalTasks = normalizedTasks.length;
  const taskPct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const habitsToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const habitPct    = habits.length > 0 ? Math.round((habitsToday / habits.length) * 100) : 0;

  const overallPct  = Math.round((taskPct + habitPct) / 2);
  const urgentTasks = normalizedTasks.filter((t) => t.status !== 'done' && t.priority === 'high').slice(0, 4);
  const todayHabits = habits.slice(0, 5);
  const todayEvents = agenda
    .filter((e) => e.date?.startsWith(todayStr))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);
  const topGoals = [...goals]
    .filter((g) => g.current < g.target)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const isYasmin = currentUser?.username === 'yasmin';

  return (
    <motion.div className="p-6 lg:p-8" variants={container} initial="initial" animate="animate">
      <div className="space-y-6">

        {/* Saudação */}
        <motion.div variants={item}>
          <p className="text-sm font-mono mb-1 capitalize" style={{ color: 'var(--text-4)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="font-bold text-2xl lg:text-3xl" style={{ color: 'var(--text)' }}>
            {greeting},{' '}
            <span style={{ color: 'var(--accent-light)' }}>{currentUser?.name}</span>!
          </h2>
        </motion.div>

        {/* Stats — 4 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="SALDO"
            value={fmt(balance)}
            sub={`${fmt(totalIncome)} entrada`}
            color={balance >= 0 ? 'var(--green)' : 'var(--red)'}
            icon={DollarSign}
            delay={0.05}
          />
          <StatCard
            label="TAREFAS"
            value={`${doneTasks}/${totalTasks}`}
            sub={`${taskPct}% concluídas`}
            color="var(--blue)"
            icon={CheckSquare}
            delay={0.10}
          />
          <StatCard
            label="HÁBITOS"
            value={`${habitsToday}/${habits.length}`}
            sub={`${habitPct}% hoje`}
            color="var(--teal)"
            icon={Flame}
            delay={0.15}
          />
          <StatCard
            label="METAS"
            value={`${topGoals.length}`}
            sub="em progresso"
            color="var(--amber)"
            icon={Target}
            delay={0.20}
          />
        </div>

        {/* Row 2: Tarefas urgentes + Progresso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Tarefas Urgentes</h3>
              <motion.button
                onClick={() => setActiveTab('tasks')}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: 'var(--accent-light)' }}
                whileHover={{ x: 2 }}
              >
                Ver todas <ArrowRight size={11} />
              </motion.button>
            </div>
            {urgentTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 py-5 justify-center"
              >
                <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  Nenhuma tarefa urgente! 🎉
                </p>
              </motion.div>
            ) : urgentTasks.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-xl border mb-2 last:mb-0"
                style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}
              >
                <Circle size={14} style={{ color: 'var(--red)', marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                  {t.description && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-4)' }}>{t.description}</p>
                  )}
                </div>
                <span className="tag text-xs shrink-0"
                  style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                  urgente
                </span>
              </motion.div>
            ))}
          </Card>

          <Card>
            <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Progresso do Dia</h3>
            <div className="space-y-4">
              <ProgressRow label="Tarefas" value={taskPct}  color="var(--blue)" />
              <ProgressRow label="Hábitos" value={habitPct} color="var(--teal)" />
              <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="label mb-2">GERAL</p>
                <div className="flex items-center gap-3">
                  <motion.span
                    className="font-bold text-4xl"
                    style={{ color: 'var(--green)' }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    {overallPct}%
                  </motion.span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--green)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${overallPct}%` }}
                      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3: Hábitos + Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Hábitos de Hoje</h3>
              <motion.button onClick={() => setActiveTab('habits')} whileHover={{ x: 2 }}
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: 'var(--teal)' }}>
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            {todayHabits.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-4)' }}>Nenhum hábito cadastrado</p>
            ) : (
              <div className="space-y-2">
                {todayHabits.map((h, i) => {
                  const done = h.completedDates.includes(todayStr);
                  return (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                      style={{
                        background:   done ? 'var(--green-bg)' : 'var(--bg-muted)',
                        borderColor:  done ? 'var(--green-border)' : 'var(--border)',
                      }}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span className={`flex-1 text-sm font-medium ${done ? 'line-through opacity-50' : ''}`}
                        style={{ color: 'var(--text)' }}>
                        {h.name}
                      </span>
                      {h.streak > 0 && (
                        <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>🔥{h.streak}</span>
                      )}
                      {done
                        ? <CheckCircle2 size={15} style={{ color: 'var(--green)' }} />
                        : <Circle size={15} style={{ color: 'var(--text-4)' }} />
                      }
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Agenda de Hoje</h3>
              <motion.button onClick={() => setActiveTab('agenda')} whileHover={{ x: 2 }}
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-light)' }}>
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            {todayEvents.length === 0 ? (
              <div className="flex items-center gap-3 py-5 justify-center" style={{ color: 'var(--text-4)' }}>
                <Calendar size={18} />
                <p className="text-sm">Sem eventos hoje</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl border"
                    style={{ borderColor: (ev.color || 'var(--border-md)') + '30', backgroundColor: (ev.color || 'var(--bg-muted)') + '0D' }}
                  >
                    <div className="w-1 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: ev.color || 'var(--blue)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{ev.title}</p>
                      <p className="text-xs font-mono mt-0.5 flex items-center gap-1"
                        style={{ color: ev.color || 'var(--text-3)' }}>
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

        {/* Row 4: Financeiro + Metas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Financeiro</h3>
              <motion.button onClick={() => setActiveTab('finance')} whileHover={{ x: 2 }}
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-light)' }}>
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            <div className="rounded-xl p-4 mb-4 border"
              style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={13} style={{ color: 'var(--text-3)' }} />
                <p className="label">SALDO TOTAL</p>
              </div>
              <motion.p
                className="font-bold text-3xl"
                style={{ color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                {fmt(balance)}
              </motion.p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3"
                style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp size={12} style={{ color: 'var(--green)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Entradas</span>
                </div>
                <p className="font-bold text-base" style={{ color: 'var(--green)' }}>{fmt(totalIncome)}</p>
              </div>
              <div className="rounded-xl p-3"
                style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingDown size={12} style={{ color: 'var(--red)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Saídas</span>
                </div>
                <p className="font-bold text-base" style={{ color: 'var(--red)' }}>{fmt(totalExpense)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Metas em Progresso</h3>
              <motion.button onClick={() => setActiveTab('goals')} whileHover={{ x: 2 }}
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: 'var(--amber)' }}>
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            {topGoals.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-4)' }}>Nenhuma meta</p>
            ) : (
              <div className="space-y-4">
                {topGoals.map((g, i) => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium" style={{ color: 'var(--text-2)' }}>{g.title}</span>
                        <span className="font-mono font-semibold" style={{ color: g.color || 'var(--amber)' }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                          style={{ backgroundColor: g.color || 'var(--amber)' }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

      </div>

      {isYasmin && <CatMascot />}
    </motion.div>
  );
}
