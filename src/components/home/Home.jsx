// src/components/home/Home.jsx — Tela Início

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNav  } from '../../context/NavContext';
import { useApp  } from '../../context/AppContext';
import api from '../../services/api';
import {
  Sun, Sunrise, Sunset, Moon,
  CheckSquare, Flame, CalendarCheck, ArrowRight,
  TrendingUp, Zap,
} from 'lucide-react';

// ── Frases motivacionais ──────────────────────────────────────
const PHRASES = [
  'Faça o hoje valer a pena.',
  'Cada dia é uma nova chance.',
  'Pequenos passos, grandes conquistas.',
  'Foco, disciplina e consistência.',
  'Você é mais forte do que imagina.',
  'Construa o futuro que você merece.',
  'A jornada começa com um único passo.',
  'Progresso, não perfeição.',
  'Seja melhor do que ontem.',
  'Sua dedicação define seu destino.',
  'O sucesso é a soma de pequenos esforços.',
  'Hoje é o melhor dia para começar.',
];

function getDailyPhrase() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return PHRASES[dayOfYear % PHRASES.length];
}

// ── Saudação por horário ──────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'Bom dia',       Icon: Sunrise };
  if (h >= 12 && h < 18) return { text: 'Boa tarde',     Icon: Sun     };
  if (h >= 18 && h < 22) return { text: 'Boa noite',     Icon: Sunset  };
  return                         { text: 'Boa madrugada', Icon: Moon    };
}

// ── Streak — apenas dias com completed=true ──────────────────
function calcStreak(checkins) {
  // Filtra apenas os dias realmente finalizados
  const completed = checkins.filter((c) => c.completed);
  if (!completed.length) return 0;
  const set   = new Set(completed.map((c) => c.date));
  const today = new Date();
  let streak  = 0;
  const cur   = new Date(today);

  const todayStr = cur.toISOString().split('T')[0];
  if (!set.has(todayStr)) cur.setDate(cur.getDate() - 1);

  while (true) {
    const ds = cur.toISOString().split('T')[0];
    if (set.has(ds)) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

// ── Grid de atividade — apenas dias finalizados (completed=true) ──
function buildGrid(checkins) {
  // Só conta dias onde o usuário clicou em "Finalizar Dia"
  const activeSet = new Set(checkins.filter((c) => c.completed).map((c) => c.date));
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  // Começa no último domingo, 52 semanas atrás
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - 7 * 51);

  const weeks = [];
  const cur   = new Date(start);

  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const ds      = cur.toISOString().split('T')[0];
      const isFuture = cur > today;
      week.push({ date: ds, active: !isFuture && activeSet.has(ds), future: isFuture });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// Month labels: detecta onde começa cada mês nas semanas
function getMonthLabels(weeks) {
  const labels = [];
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => !d.future);
    if (!firstDay) return;
    const m = new Date(firstDay.date).getMonth();
    if (m !== lastMonth) { labels.push({ index: wi, label: MONTHS[m] }); lastMonth = m; }
  });
  return labels;
}

// ── Activity Grid component ───────────────────────────────────
function ActivityGrid({ checkins }) {
  const weeks       = buildGrid(checkins);
  const monthLabels = getMonthLabels(weeks);
  const total = checkins.filter((c) => c.completed).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-4)', letterSpacing: '0.06em' }}>
          Atividade — {total} {total === 1 ? 'dia' : 'dias'} registrados
        </p>
      </div>

      <div
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
        }}
      >
        <div style={{ display: 'inline-block', minWidth: 0 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 4, paddingLeft: 0 }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find((l) => l.index === wi);
              return (
                <div
                  key={wi}
                  style={{ width: 11, fontSize: 9, color: 'var(--text-4)', fontWeight: 600, flexShrink: 0, textAlign: 'left' }}
                >
                  {lbl ? lbl.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid: 7 rows × N weeks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0,1,2,3,4,5,6].map((dayIdx) => (
              <div key={dayIdx} style={{ display: 'flex', gap: 2 }}>
                {weeks.map((week, wi) => {
                  const cell = week[dayIdx];
                  if (!cell) return <div key={wi} style={{ width: 11, height: 11, flexShrink: 0 }} />;
                  return (
                    <div
                      key={wi}
                      title={cell.date}
                      style={{
                        width:        11,
                        height:       11,
                        borderRadius: 3,
                        flexShrink:   0,
                        background:   cell.future
                          ? 'transparent'
                          : cell.active
                            ? 'var(--green)'
                            : 'var(--bg-muted)',
                        border: cell.future ? 'none' : `1px solid ${cell.active ? 'var(--green-border)' : 'var(--border)'}`,
                        opacity: cell.active ? 1 : 0.6,
                        transition: 'background 0.15s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mini stat card ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, onClick }) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
      style={{
        background:   '#ffffff',
        border:       '1px solid var(--border-md)',
        borderRadius: 16,
        padding:      '16px 18px',
        cursor:       onClick ? 'pointer' : 'default',
        display:      'flex',
        flexDirection:'column',
        gap:          10,
        transition:   'border-color 0.15s, box-shadow 0.15s',
      }}
      whileHover={onClick ? { borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-md)' } : {}}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon size={18} style={{ color: 'var(--text-4)' }} />
        {onClick && <ArrowRight size={13} style={{ color: 'var(--text-4)' }} />}
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontWeight: 400 }}>{label}</p>
      </div>
    </motion.div>
  );
}

// ── Today's agenda events ─────────────────────────────────────
function TodayAgenda({ agenda, onNavigate }) {
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayEvents = (agenda || [])
    .filter((e) => e.date && e.date.startsWith(todayStr))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  if (!todayEvents.length) return null;

  return (
    <div
      style={{
        background:   '#ffffff',
        border:       '1px solid var(--border-md)',
        borderRadius: 16,
        padding:      '18px 20px',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          Agenda de hoje
        </p>
        <button
          onClick={() => onNavigate('agenda')}
          style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}
        >
          Ver tudo →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {todayEvents.map((ev) => (
          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width:        6,
                height:       6,
                borderRadius: '50%',
                background:   'var(--text-3)',
                flexShrink:   0,
              }}
            />
            <p style={{ fontSize: 14, color: 'var(--text)', flex: 1, fontWeight: 500 }}>{ev.title}</p>
            <span style={{ fontSize: 12, color: 'var(--text-4)', fontFamily: 'monospace' }}>
              {new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Home() {
  const { currentUser }          = useAuth();
  const { setActiveTab }         = useNav();
  const { tasks, habits, agenda } = useApp();

  const [checkins, setCheckins] = useState([]);
  const [loadingCI, setLoadingCI] = useState(true);

  const { text: greetText, Icon: GreetIcon } = getGreeting();
  const phrase = getDailyPhrase();

  useEffect(() => {
    api.get('/checkins')
      .then((r) => setCheckins(r.data.checkins || []))
      .catch(() => {})
      .finally(() => setLoadingCI(false));
  }, []);

  // Stats
  const todayStr       = new Date().toISOString().split('T')[0];
  const streak         = calcStreak(checkins);
  const doneTasks      = (tasks  || []).filter((t) => t.completed || t.status === 'done').length;
  const habitsToday    = (habits || []).filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const totalHabits    = (habits || []).length;
  // check-in de hoje conta apenas se foi finalizado
  const checkinToday   = checkins.find((c) => c.date === todayStr && c.completed);

  const firstName = (currentUser?.name || 'você').split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div style={{ padding: '32px 24px 40px', maxWidth: 680, margin: '0 auto' }}>

        {/* ── Cabeçalho / Saudação ─────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <GreetIcon size={15} style={{ color: 'var(--text-4)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{greetText}</p>
          </div>

          <h1
            style={{
              fontSize:     'clamp(26px, 5vw, 32px)',
              fontWeight:   700,
              color:        'var(--text)',
              lineHeight:   1.15,
              letterSpacing: '-0.01em',
              marginBottom: 8,
            }}
          >
            Olá, {firstName}
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text-3)', lineHeight: 1.6 }}>
            {phrase}
          </p>

          {/* Check-in CTA */}
          {!checkinToday && (
            <motion.button
              onClick={() => setActiveTab('checkin')}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop:    18,
                display:      'inline-flex',
                alignItems:   'center',
                gap:          8,
                background:   'var(--text)',
                color:        '#ffffff',
                border:       'none',
                borderRadius: 12,
                padding:      '10px 18px',
                fontSize:     14,
                fontWeight:   600,
                cursor:       'pointer',
              }}
            >
              <CalendarCheck size={15} />
              Fazer check-in de hoje
              <ArrowRight size={14} />
            </motion.button>
          )}

          {checkinToday && (
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--green-bg)', border: '1px solid var(--green-border)',
              borderRadius: 10, padding: '6px 12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                Check-in de hoje concluído
              </p>
            </div>
          )}
        </div>

        {/* ── Stats cards ───────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap:                 14,
            marginBottom:        28,
          }}
        >
          <StatCard
            icon={Zap}
            label="Sequência de check-ins"
            value={streak === 0 ? '–' : `${streak}d`}
            onClick={() => setActiveTab('checkin')}
          />
          <StatCard
            icon={CheckSquare}
            label="Tarefas concluídas"
            value={doneTasks}
            onClick={() => setActiveTab('tasks')}
          />
          <StatCard
            icon={Flame}
            label={`Hábitos hoje (${totalHabits})`}
            value={`${habitsToday}/${totalHabits}`}
            onClick={() => setActiveTab('habits')}
          />
          <StatCard
            icon={TrendingUp}
            label="Dias finalizados"
            value={checkins.filter((c) => c.completed).length}
          />
        </div>

        {/* ── Agenda de hoje ────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <TodayAgenda agenda={agenda} onNavigate={setActiveTab} />
        </div>

        {/* ── Activity grid ─────────────────────────────────── */}
        <div
          style={{
            background:   '#ffffff',
            border:       '1px solid var(--border-md)',
            borderRadius: 16,
            padding:      '20px 20px 24px',
          }}
        >
          {loadingCI ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Carregando atividade…</p>
            </div>
          ) : (
            <ActivityGrid checkins={checkins} />
          )}
        </div>

      </div>
    </motion.div>
  );
}
