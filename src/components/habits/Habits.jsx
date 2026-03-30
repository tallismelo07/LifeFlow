// src/components/habits/Habits.jsx — Rotina diária
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal, EmptyState } from '../ui';
import { Plus, Trash2, Flame, CheckCircle2, Circle, TrendingUp } from 'lucide-react';

const ICONS  = ['🏋️','📚','🧘','💧','😴','🏃','✍️','🎯','🍎','🧹','💊','🎸'];
const COLORS = [
  { label: 'Verde',  value: 'var(--green)' },
  { label: 'Cinza',  value: 'var(--text-3)' },
  { label: 'Teal',   value: 'var(--teal)' },
  { label: 'Âmbar',  value: 'var(--amber)' },
  { label: 'Rosa',   value: 'var(--red)' },
];
const BLANK = { name: '', icon: '🏋️', color: 'var(--green)', points: 30 };
const POINT_OPTIONS = [10, 20, 30, 45, 60, 100];

export default function Habits() {
  const { habits, addHabit, deleteHabit, toggleHabit } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form,      setForm]      = useState(BLANK);

  const todayStr    = new Date().toISOString().split('T')[0];
  const doneToday   = habits.filter((h) => h.completedDates.includes(todayStr));
  const doneTodayN  = doneToday.length;
  const completePct = habits.length > 0 ? Math.round((doneTodayN / habits.length) * 100) : 0;
  const totalPoints = doneToday.reduce((s, h) => s + (h.points || 30), 0);

  // Hábito com mais completions no mês atual
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const mostDoneHabit = habits.reduce((best, h) => {
    const count = (h.completedDates || []).filter((d) => d.startsWith(monthPrefix)).length;
    return count > (best?.count || 0) ? { ...h, count } : best;
  }, null);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addHabit(form);
    setForm(BLANK);
    setModalOpen(false);
  };

  // Últimos 7 dias para o grid
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dayLabels = last7.map((d) =>
    new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' })
  );

  return (
    <div className="p-5 lg:p-8 space-y-5 max-w-3xl mx-auto">

      {/* Barra de progresso do dia */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              Progresso do dia
            </p>
            <p className="text-xs mt-0.5 font-mono capitalize" style={{ color: 'var(--text-4)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-2xl" style={{ color: completePct === 100 ? 'var(--green)' : 'var(--text)' }}>
              {completePct}%
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
              {doneTodayN}/{habits.length}
            </p>
          </div>
        </div>
        {/* Barra */}
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completePct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              background: completePct === 100
                ? 'var(--green)'
                : 'linear-gradient(90deg, var(--text-3), var(--text-2))',
            }}
          />
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'MAIS FEITO',
            value: mostDoneHabit ? `${mostDoneHabit.icon} ${mostDoneHabit.count}×` : '—',
            sub:   mostDoneHabit?.name || 'nenhum',
            color: 'var(--text)',
          },
          {
            label: 'MÊS',
            value: habits.reduce((s, h) =>
              s + (h.completedDates || []).filter((d) => d.startsWith(monthPrefix)).length, 0
            ),
            sub:   'completions',
            color: 'var(--text)',
          },
          {
            label: 'XP HOJE',
            value: `+${totalPoints}`,
            sub:   'pontos',
            color: 'var(--green)',
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="card text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <p className="label mb-1.5">{s.label}</p>
            <p className="font-bold text-xl leading-tight" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
              {s.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Header + botão */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
          Hábitos de hoje
        </h3>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2"><Plus size={15} /> Novo</span>
        </Button>
      </div>

      {/* Lista de hábitos */}
      {habits.length === 0 ? (
        <EmptyState icon={Flame} title="Nenhum hábito cadastrado" description="Adicione seu primeiro hábito" />
      ) : (
        <motion.div
          className="space-y-2"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        >
          <AnimatePresence>
            {habits.map((habit) => {
              const done   = habit.completedDates.includes(todayStr);
              const points = habit.points || 30;
              return (
                <motion.div
                  key={habit.id}
                  layout
                  variants={{ initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 } }}
                  exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }}
                  className="flex items-center gap-4 p-4 rounded-2xl border group cursor-pointer transition-all"
                  style={{
                    background:   done ? habit.color + '0D' : 'var(--bg-soft)',
                    borderColor:  done ? habit.color + '35' : 'var(--border)',
                  }}
                  onClick={() => toggleHabit(habit.id)}
                  whileHover={{ scale: 1.008 }}
                  whileTap={{ scale: 0.985 }}
                >
                  {/* Left color bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                    style={{ backgroundColor: habit.color, position: 'relative', width: 3, borderRadius: 9999, alignSelf: 'stretch', flexShrink: 0 }}
                  />

                  {/* Check */}
                  <motion.div
                    animate={{ scale: done ? [1, 1.25, 1] : 1 }}
                    transition={{ duration: 0.28 }}
                    onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }}
                    className="shrink-0"
                  >
                    {done
                      ? <CheckCircle2 size={22} style={{ color: habit.color }} />
                      : <Circle size={22} style={{ color: 'var(--border-strong)' }} />
                    }
                  </motion.div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{habit.icon}</span>
                      <span
                        className={`font-medium text-sm ${done ? 'line-through' : ''}`}
                        style={{ color: done ? 'var(--text-4)' : 'var(--text)' }}
                      >
                        {habit.name}
                      </span>
                    </div>
                    {habit.streak > 0 && (
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--amber)' }}>
                        🔥 {habit.streak} {habit.streak === 1 ? 'dia' : 'dias'}
                      </p>
                    )}
                  </div>

                  {/* Pontos */}
                  <motion.span
                    animate={{ color: done ? 'var(--green)' : 'var(--text-4)' }}
                    className="text-sm font-bold font-mono shrink-0"
                  >
                    +{points}
                  </motion.span>

                  {/* Delete */}
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                    style={{ color: 'var(--text-4)' }}
                    whileHover={{ scale: 1.1, color: 'var(--red)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Grid 7 dias */}
      {habits.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Histórico — 7 dias
            </h3>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-4)' }}>
              <TrendingUp size={13} />
              <span className="text-xs font-mono">
                {habits.reduce((s, h) => s + (h.completedDates || []).filter((d) => last7.includes(d)).length, 0)} completions
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 min-w-[110px] font-normal" style={{ color: 'var(--text-4)' }}>
                    Hábito
                  </th>
                  {last7.map((d, i) => (
                    <th
                      key={d}
                      className="text-center pb-2 px-1 font-mono font-normal"
                      style={{ color: d === todayStr ? 'var(--green)' : 'var(--text-4)' }}
                    >
                      <div>{dayLabels[i].slice(0, 3)}</div>
                      <div className="text-[10px] mt-0.5">{new Date(d + 'T12:00').getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id}>
                    <td className="py-1 pr-3">
                      <span className="mr-1">{habit.icon}</span>
                      <span style={{ color: 'var(--text-3)' }}>{habit.name}</span>
                    </td>
                    {last7.map((d) => {
                      const done = habit.completedDates.includes(d);
                      return (
                        <td key={d} className="text-center py-1 px-1">
                          <motion.div
                            className="w-6 h-6 rounded-lg mx-auto"
                            style={{
                              background: done ? habit.color + '28' : 'var(--bg-muted)',
                              border: `1px solid ${done ? habit.color + '55' : 'var(--border)'}`,
                            }}
                            animate={{ scale: done ? [1, 1.15, 1] : 1 }}
                            transition={{ duration: 0.2 }}
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Hábito">
        <div className="space-y-4">
          <Input
            label="Nome *"
            placeholder="Ex: Ler 30 minutos"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />

          <div>
            <span className="label block mb-2">ÍCONE</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <motion.button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-xl p-2 rounded-xl border transition-colors"
                  style={{
                    borderColor: form.icon === icon ? 'var(--border-strong)' : 'var(--border)',
                    background:  form.icon === icon ? 'var(--bg-raised)' : 'var(--bg-muted)',
                  }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <span className="label block mb-2">COR</span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(({ value }) => (
                <motion.button
                  key={value}
                  onClick={() => setForm({ ...form, color: value })}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: value,
                    borderColor: form.color === value ? 'var(--text)' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="label block mb-2">PONTOS XP</span>
            <div className="flex gap-2 flex-wrap">
              {POINT_OPTIONS.map((pts) => (
                <motion.button
                  key={pts}
                  onClick={() => setForm({ ...form, points: pts })}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl border transition-all"
                  style={{
                    background:   form.points === pts ? 'var(--bg-raised)' : 'var(--bg-muted)',
                    borderColor:  form.points === pts ? 'var(--border-strong)' : 'var(--border)',
                    color:        form.points === pts ? 'var(--text)' : 'var(--text-4)',
                  }}
                >
                  +{pts}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleAdd}>Criar Hábito</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
