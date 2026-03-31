// src/components/habits/Habits.jsx — CRUD completo: criar, editar, deletar, completar
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal, EmptyState } from '../ui';
import { Plus, Trash2, Flame, CheckCircle2, Circle, TrendingUp, Pencil } from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────
const ICONS = ['🏋️','📚','🧘','💧','😴','🏃','✍️','🎯','🍎','🧹','💊','🎸','🚴','🧪','🌿','💤','🎨','🏊'];

const COLORS = [
  { label: 'Verde',   value: 'var(--green)'  },
  { label: 'Azul',    value: 'var(--blue)'   },
  { label: 'Âmbar',   value: 'var(--amber)'  },
  { label: 'Rosa',    value: 'var(--red)'    },
  { label: 'Teal',    value: 'var(--teal)'   },
  { label: 'Cinza',   value: 'var(--text-3)' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily',    label: 'Diário',      sub: 'todo dia'    },
  { value: 'weekdays', label: 'Dias úteis',  sub: 'seg – sex'   },
  { value: 'weekly',   label: 'Semanal',     sub: '1× semana'   },
  { value: '3x',       label: '3× semana',   sub: 'ter/qui/sáb' },
];

const POINT_OPTIONS = [10, 20, 30, 45, 60, 100];

const BLANK = { name: '', icon: '🏋️', color: 'var(--green)', points: 30, frequency: 'daily', description: '' };

const freqLabel = (f) => FREQUENCY_OPTIONS.find((o) => o.value === f)?.label ?? 'Diário';

// ── Componente principal ──────────────────────────────────────────────────────
export default function Habits() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabit } = useApp();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null); // id do hábito em edição (null = criação)
  const [form,       setForm]       = useState(BLANK);

  // ── Datas e stats ───────────────────────────────────────────────────────────
  const todayStr    = new Date().toISOString().split('T')[0];
  const doneToday   = habits.filter((h) => (h.completedDates || []).includes(todayStr));
  const doneTodayN  = doneToday.length;
  const completePct = habits.length > 0 ? Math.round((doneTodayN / habits.length) * 100) : 0;
  const totalPoints = doneToday.reduce((s, h) => s + (h.points || 30), 0);

  const monthPrefix = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
  const mostDoneHabit = habits.reduce((best, h) => {
    const count = (h.completedDates || []).filter((d) => d.startsWith(monthPrefix)).length;
    return count > (best?.count || 0) ? { ...h, count } : best;
  }, null);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dayLabels = last7.map((d) =>
    new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' })
  );

  // ── Modal: abrir para criar ─────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK);
    setModalOpen(true);
  };

  // ── Modal: abrir para editar ────────────────────────────────────────────────
  const openEdit = (habit) => {
    setEditTarget(habit.id);
    setForm({
      name:        habit.name        || '',
      icon:        habit.icon        || '🏋️',
      color:       habit.color       || 'var(--green)',
      points:      habit.points      || 30,
      frequency:   habit.frequency   || 'daily',
      description: habit.description || '',
    });
    setModalOpen(true);
  };

  // ── Salvar (criar ou editar) ────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editTarget) {
      updateHabit(editTarget, {
        name:        form.name.trim(),
        icon:        form.icon,
        color:       form.color,
        points:      form.points,
        frequency:   form.frequency,
        description: form.description.trim(),
      });
    } else {
      addHabit({
        name:        form.name.trim(),
        icon:        form.icon,
        color:       form.color,
        points:      form.points,
        frequency:   form.frequency,
        description: form.description.trim(),
      });
    }
    setModalOpen(false);
    setForm(BLANK);
    setEditTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 lg:p-8 space-y-5 max-w-3xl mx-auto">

      {/* ── Progresso do dia ─────────────────────────────────── */}
      <motion.div className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-base" style={{ color:'var(--text)' }}>Progresso do dia</p>
            <p className="text-xs mt-0.5 font-mono capitalize" style={{ color:'var(--text-4)' }}>
              {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-2xl" style={{ color:completePct===100?'var(--green)':'var(--text)' }}>
              {completePct}%
            </p>
            <p className="text-xs font-mono" style={{ color:'var(--text-4)' }}>{doneTodayN}/{habits.length}</p>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background:'var(--bg-muted)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width:0 }}
            animate={{ width:`${completePct}%` }}
            transition={{ duration:0.7, ease:'easeOut' }}
            style={{ background: completePct===100 ? 'var(--green)' : 'linear-gradient(90deg,var(--text-3),var(--text-2))' }}
          />
        </div>
      </motion.div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'MAIS FEITO', value: mostDoneHabit?`${mostDoneHabit.icon} ${mostDoneHabit.count}×`:'—', sub:mostDoneHabit?.name||'nenhum', color:'var(--text)' },
          { label:'MÊS',        value: habits.reduce((s,h)=>s+(h.completedDates||[]).filter((d)=>d.startsWith(monthPrefix)).length,0), sub:'completions', color:'var(--text)' },
          { label:'XP HOJE',    value:`+${totalPoints}`, sub:'pontos', color:'var(--green)' },
        ].map((s,i) => (
          <motion.div key={s.label} className="card text-center"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
            <p className="label mb-1.5">{s.label}</p>
            <p className="font-bold text-xl leading-tight" style={{ color:s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color:'var(--text-4)' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Header + botão novo ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color:'var(--text)' }}>Hábitos de hoje</h3>
        <Button onClick={openCreate}>
          <span className="flex items-center gap-2"><Plus size={15}/> Novo</span>
        </Button>
      </div>

      {/* ── Lista de hábitos ─────────────────────────────────── */}
      {habits.length === 0 ? (
        <EmptyState icon={Flame} title="Nenhum hábito cadastrado" description="Adicione seu primeiro hábito para começar" />
      ) : (
        <motion.div className="space-y-2" layout>
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => {
              const done      = (habit.completedDates || []).includes(todayStr);
              const points    = habit.points || 30;
              const frequency = freqLabel(habit.frequency);

              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity:0, x:-8 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:8, scale:0.95, transition:{ duration:0.15 } }}
                  className="flex items-center gap-4 p-4 rounded-2xl border group cursor-pointer transition-colors"
                  style={{
                    background:  done ? habit.color + '0D' : 'var(--bg-soft)',
                    borderColor: done ? habit.color + '35' : 'var(--border)',
                  }}
                  onClick={() => toggleHabit(habit.id)}
                  whileHover={{ scale:1.005 }}
                  whileTap={{ scale:0.985 }}
                >
                  {/* Barra de cor lateral */}
                  <div className="shrink-0 self-stretch rounded-full" style={{ width:3, background:habit.color }} />

                  {/* Ícone de check */}
                  <motion.div
                    animate={{ scale: done ? [1,1.3,1] : 1 }}
                    transition={{ duration:0.28 }}
                    onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }}
                    className="shrink-0"
                  >
                    {done
                      ? <CheckCircle2 size={22} style={{ color:habit.color }}/>
                      : <Circle      size={22} style={{ color:'var(--border-strong)' }}/>
                    }
                  </motion.div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg leading-none">{habit.icon}</span>
                      <span
                        className={`font-medium text-sm ${done ? 'line-through' : ''}`}
                        style={{ color: done ? 'var(--text-4)' : 'var(--text)' }}
                      >
                        {habit.name}
                      </span>
                      {/* Badge de frequência */}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background:'var(--bg-muted)', color:'var(--text-4)', border:'1px solid var(--border)' }}>
                        {frequency}
                      </span>
                    </div>
                    {habit.description && (
                      <p className="text-xs mt-0.5 truncate" style={{ color:'var(--text-4)' }}>
                        {habit.description}
                      </p>
                    )}
                    {habit.streak > 0 && (
                      <p className="text-xs font-mono mt-0.5" style={{ color:'var(--amber)' }}>
                        🔥 {habit.streak} {habit.streak === 1 ? 'dia' : 'dias'} seguidos
                      </p>
                    )}
                  </div>

                  {/* Pontos */}
                  <motion.span
                    animate={{ color: done ? 'var(--green)' : 'var(--text-4)' }}
                    className="text-sm font-bold font-mono shrink-0 hidden sm:block"
                  >
                    +{points}
                  </motion.span>

                  {/* Ações (visíveis no hover) */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <motion.button
                      onClick={() => openEdit(habit)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color:'var(--text-4)' }}
                      whileHover={{ scale:1.15 }}
                      whileTap={{ scale:0.9 }}
                      title="Editar hábito"
                    >
                      <Pencil size={13}/>
                    </motion.button>
                    <motion.button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color:'var(--text-4)' }}
                      whileHover={{ scale:1.15, color:'var(--red)' }}
                      whileTap={{ scale:0.9 }}
                      title="Excluir hábito"
                    >
                      <Trash2 size={13}/>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Histórico 7 dias ──────────────────────────────────── */}
      {habits.length > 0 && (
        <motion.div className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color:'var(--text)' }}>Histórico — 7 dias</h3>
            <div className="flex items-center gap-1.5" style={{ color:'var(--text-4)' }}>
              <TrendingUp size={13}/>
              <span className="text-xs font-mono">
                {habits.reduce((s,h)=>s+(h.completedDates||[]).filter((d)=>last7.includes(d)).length,0)} completions
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 min-w-[110px] font-normal" style={{ color:'var(--text-4)' }}>Hábito</th>
                  {last7.map((d, i) => (
                    <th key={d} className="text-center pb-2 px-1 font-mono font-normal"
                      style={{ color: d===todayStr ? 'var(--green)' : 'var(--text-4)' }}>
                      <div>{dayLabels[i].slice(0,3)}</div>
                      <div className="text-[10px] mt-0.5">{new Date(d+'T12:00').getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id}>
                    <td className="py-1 pr-3">
                      <span className="mr-1">{habit.icon}</span>
                      <span style={{ color:'var(--text-3)' }}>{habit.name}</span>
                    </td>
                    {last7.map((d) => {
                      const done = (habit.completedDates||[]).includes(d);
                      return (
                        <td key={d} className="text-center py-1 px-1">
                          <motion.div
                            className="w-6 h-6 rounded-lg mx-auto"
                            style={{
                              background: done ? habit.color+'28' : 'var(--bg-muted)',
                              border:`1px solid ${done ? habit.color+'55' : 'var(--border)'}`,
                            }}
                            animate={{ scale: done ? [1,1.15,1] : 1 }}
                            transition={{ duration:0.2 }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Modal criar / editar ──────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); setForm(BLANK); }}
        title={editTarget ? 'Editar Hábito' : 'Novo Hábito'}
      >
        <div className="space-y-4">

          {/* Nome */}
          <Input
            label="Nome *"
            placeholder="Ex: Ler 30 minutos"
            value={form.name}
            onChange={(e) => setForm({ ...form, name:e.target.value })}
            onKeyDown={(e) => e.key==='Enter' && handleSubmit()}
            autoFocus
          />

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="label">DESCRIÇÃO (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Antes de dormir, sem exceções"
              value={form.description}
              onChange={(e) => setForm({ ...form, description:e.target.value })}
              className="input-base"
              maxLength={120}
            />
          </div>

          {/* Frequência */}
          <div>
            <span className="label block mb-2">FREQUÊNCIA</span>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, frequency:opt.value })}
                  className="flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all"
                  style={form.frequency===opt.value
                    ? { background:'var(--blue)', color:'var(--on-blue)', borderColor:'var(--blue)' }
                    : { background:'var(--bg-muted)', color:'var(--text-3)', borderColor:'var(--border)' }
                  }
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div>
            <span className="label block mb-2">ÍCONE</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <motion.button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  whileHover={{ scale:1.15 }} whileTap={{ scale:0.9 }}
                  className="text-xl p-2 rounded-xl border transition-colors"
                  style={{
                    borderColor: form.icon===icon ? 'var(--border-strong)' : 'var(--border)',
                    background:  form.icon===icon ? 'var(--bg-raised)'     : 'var(--bg-muted)',
                  }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <span className="label block mb-2">COR</span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(({ value }) => (
                <motion.button
                  key={value}
                  onClick={() => setForm({ ...form, color:value })}
                  whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: value,
                    borderColor: form.color===value ? 'var(--text)' : 'transparent',
                    transform:   form.color===value ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pontos XP */}
          <div>
            <span className="label block mb-2">PONTOS XP</span>
            <div className="flex gap-2 flex-wrap">
              {POINT_OPTIONS.map((pts) => (
                <motion.button
                  key={pts}
                  onClick={() => setForm({ ...form, points:pts })}
                  whileHover={{ scale:1.06 }} whileTap={{ scale:0.94 }}
                  className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl border transition-all"
                  style={{
                    background:  form.points===pts ? 'var(--bg-raised)' : 'var(--bg-muted)',
                    borderColor: form.points===pts ? 'var(--border-strong)' : 'var(--border)',
                    color:       form.points===pts ? 'var(--text)' : 'var(--text-4)',
                  }}
                >
                  +{pts}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>
              {editTarget ? 'Salvar Alterações' : 'Criar Hábito'}
            </Button>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditTarget(null); setForm(BLANK); }}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
