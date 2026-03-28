// src/components/dashboard/Dashboard.jsx — fully animated
import { motion } from 'framer-motion';
import { useApp }  from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../ui';
import {
  CheckSquare, Flame, TrendingUp, TrendingDown, DollarSign,
  Target, ArrowRight, Circle, CheckCircle2, Timer, Calendar, Clock,
} from 'lucide-react';

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// Stagger container for children
const container = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

function ProgressRow({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>{label}</span>
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
  const { tasks, habits, balance, totalIncome, totalExpense, studyItems, goals, agenda, setActiveTab } = useApp();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  const normalizedTasks = tasks.map((t) => ({ ...t, status: t.status || (t.completed ? 'done' : 'todo') }));
  const doneTasks   = normalizedTasks.filter((t) => t.status === 'done').length;
  const totalTasks  = normalizedTasks.length;
  const taskPct     = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const habitsToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const habitPct    = habits.length > 0 ? Math.round((habitsToday / habits.length) * 100) : 0;

  const studyingItems = studyItems.filter((s) => s.status === 'studying');
  const studyPct      = studyingItems.length > 0
    ? Math.round(studyingItems.reduce((s, i) => s + i.progress, 0) / studyingItems.length) : 0;

  const overallPct  = Math.round((taskPct + habitPct + studyPct) / 3);
  const urgentTasks = normalizedTasks.filter((t) => t.status !== 'done' && t.priority === 'high').slice(0, 4);
  const todayHabits = habits.slice(0, 5);
  const todayEvents = agenda
    .filter((e) => e.date.startsWith(todayStr))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);
  const topGoals = [...goals]
    .filter((g) => g.current < g.target)
    .sort((a, b) => (b.current / b.target) - (a.current / a.target))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <motion.div
      className="p-6 lg:p-8"
      variants={container}
      initial="initial"
      animate="animate"
    >
      <div className="space-y-6">

        {/* Greeting */}
        <motion.div variants={item}>
          <p className="text-sm font-mono mb-1 capitalize"
            style={{ color: 'color-mix(in srgb, var(--text) 40%, transparent)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="font-bold text-2xl lg:text-3xl" style={{ color: 'var(--text)' }}>
            {greeting},{' '}
            <span style={{ color: currentUser?.color || 'var(--blue)' }}>{currentUser?.name}</span>!
          </h2>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="SALDO"   value={fmt(balance)}                    sub={`${fmt(totalIncome)} receita`}          color={balance >= 0 ? 'var(--green)' : 'var(--red)'} icon={DollarSign} delay={0.05} />
          <StatCard label="TAREFAS" value={`${doneTasks}/${totalTasks}`}     sub={`${taskPct}% concluídas`}               color="var(--blue)"  icon={CheckSquare} delay={0.1}  />
          <StatCard label="HÁBITOS" value={`${habitsToday}/${habits.length}`} sub={`${habitPct}% hoje`}                   color="var(--teal)"  icon={Flame}       delay={0.15} />
          <StatCard label="ESTUDOS" value={`${studyPct}%`}                    sub={`${studyingItems.length} em andamento`} color="var(--amber)"  icon={Target}      delay={0.2}  />
        </div>

        {/* Row 2: Tasks + Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Tarefas Urgentes</h3>
              <motion.button
                onClick={() => setActiveTab('tasks')}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: 'var(--blue)' }}
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
                <CheckCircle2 size={20} style={{color:'var(--blue)'}} />
                <p className="text-sm" style={{ color: 'color-mix(in srgb, var(--text) 50%, transparent)' }}>
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
                <Circle size={14} className="text-accent-rose mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                  {t.description && (
                    <p className="text-xs truncate mt-0.5"
                      style={{ color: 'color-mix(in srgb, var(--text) 35%, transparent)' }}>
                      {t.description}
                    </p>
                  )}
                </div>
                <span className="tag bg-accent-rose/10 text-accent-rose text-xs shrink-0">urgente</span>
              </motion.div>
            ))}
          </Card>

          <Card>
            <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Progresso do Dia</h3>
            <div className="space-y-4">
              <ProgressRow label="Tarefas" value={taskPct}  color="var(--blue)" />
              <ProgressRow label="Hábitos" value={habitPct} color="var(--teal)" />
              <ProgressRow label="Estudos" value={studyPct} color="var(--amber)" />
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
                      className="h-full rounded-full" style={{backgroundColor:'var(--green)'}}
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

        {/* Row 3: Habits + Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Hábitos de Hoje</h3>
              <motion.button onClick={() => setActiveTab('habits')} whileHover={{ x: 2 }}
                className="text-xs text-accent-teal hover:underline flex items-center gap-1">
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            {todayHabits.length === 0 ? (
              <p className="text-sm text-center py-4"
                style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>Nenhum hábito</p>
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
                        background: done ? 'rgba(200,241,53,0.05)' : 'var(--bg-muted)',
                        borderColor: done ? 'rgba(200,241,53,0.2)' : 'var(--border)',
                      }}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span className={`flex-1 text-sm font-medium ${done ? 'line-through opacity-50' : ''}`}
                        style={{ color: 'var(--text)' }}>
                        {h.name}
                      </span>
                      {h.streak > 0 && (
                        <span className="text-xs font-mono text-accent-amber">🔥{h.streak}</span>
                      )}
                      {done
                        ? <CheckCircle2 size={15} style={{color:'var(--blue)'}} />
                        : <Circle size={15} style={{ color: 'color-mix(in srgb, var(--text) 20%, transparent)' }} />
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
                className="text-xs text-accent-blue hover:underline flex items-center gap-1">
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            {todayEvents.length === 0 ? (
              <div className="flex items-center gap-3 py-5 justify-center"
                style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
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
                    style={{ borderColor: ev.color + '30', backgroundColor: ev.color + '0D' }}
                  >
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{ev.title}</p>
                      <p className="text-xs font-mono mt-0.5 flex items-center gap-1" style={{ color: ev.color }}>
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

        {/* Row 4: Finance + Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Financeiro</h3>
              <motion.button onClick={() => setActiveTab('finance')} whileHover={{ x: 2 }}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: 'var(--blue)' }}>
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            <div className="rounded-xl p-4 mb-4 border"
              style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
              <p className="label mb-1">SALDO</p>
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
              <div className="rounded-xl p-3" style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.15)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp size={12} className="text-accent-teal" />
                  <span className="text-xs" style={{ color: 'color-mix(in srgb, var(--text) 40%, transparent)' }}>Receitas</span>
                </div>
                <p className="font-bold text-base text-accent-teal">{fmt(totalIncome)}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(240,85,106,0.05)', border: '1px solid rgba(240,85,106,0.15)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingDown size={12} className="text-accent-rose" />
                  <span className="text-xs" style={{ color: 'color-mix(in srgb, var(--text) 40%, transparent)' }}>Despesas</span>
                </div>
                <p className="font-bold text-base text-accent-rose">{fmt(totalExpense)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Metas em Progresso</h3>
              <motion.button onClick={() => setActiveTab('goals')} whileHover={{ x: 2 }}
                className="text-xs text-accent-amber hover:underline flex items-center gap-1">
                Ver <ArrowRight size={11} />
              </motion.button>
            </div>
            {topGoals.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
                Nenhuma meta
              </p>
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
                        <span className="font-medium" style={{ color: 'color-mix(in srgb, var(--text) 70%, transparent)' }}>{g.title}</span>
                        <span className="font-mono font-semibold" style={{ color: g.color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                          style={{ backgroundColor: g.color }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Pomodoro CTA */}
        <motion.button
          variants={item}
          onClick={() => setActiveTab('pomodoro')}
          className="w-full card card-hover flex items-center gap-4 text-left"
          whileHover={{ scale: 1.005, y: -2 }}
          whileTap={{ scale: 0.998 }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:'var(--blue-bg)'}}>
            <Timer size={18} style={{color:'var(--blue)'}} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Iniciar Pomodoro</p>
            <p className="text-xs mt-0.5" style={{ color: 'color-mix(in srgb, var(--text) 35%, transparent)' }}>
              Sessão de foco de 25 minutos
            </p>
          </div>
          <ArrowRight size={16} className="ml-auto" style={{color:'var(--blue)'}} />
        </motion.button>

      </div>
    </motion.div>
  );
}
