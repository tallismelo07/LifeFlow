// src/components/habits/Habits.jsx — animated habits tracker
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal, EmptyState } from '../ui';
import { Plus, Trash2, Flame, CheckCircle2, Circle } from 'lucide-react';

const ICONS  = ['🏋️','📚','🧘','💧','😴','🏃','✍️','🎯','🍎','🧹','💊','🎸'];
const COLORS = [
  { label: 'Lima',  value: 'var(--green)' },
  { label: 'Azul',  value: 'var(--blue)' },
  { label: 'Teal',  value: 'var(--teal)' },
  { label: 'Âmbar', value: 'var(--amber)' },
  { label: 'Rosa',  value: 'var(--red)' },
];
const BLANK = { name: '', icon: '🏋️', color: 'var(--green)' };

export default function Habits() {
  const { habits, addHabit, deleteHabit, toggleHabit } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form,      setForm]      = useState(BLANK);

  const todayStr    = new Date().toISOString().split('T')[0];
  const doneToday   = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const topStreak   = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const completePct = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addHabit(form);
    setForm(BLANK);
    setModalOpen(false);
  };

  // Build last-7-days array for the weekly grid
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const dayLabels = last7.map((d) =>
    new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' })
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        initial="initial" animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
      >
        {[
          { label: 'HOJE',         value: `${doneToday}/${habits.length}`, color: 'var(--teal)' },
          { label: 'MAIOR STREAK', value: `🔥 ${topStreak}`,              color: 'var(--amber)' },
          { label: 'COMPLETO',     value: `${completePct}%`,              color: 'var(--green)' },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={{ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } }}
            className="card text-center"
            whileHover={{ y: -2 }}
          >
            <p className="label mb-2">{s.label}</p>
            <p className="font-bold text-2xl lg:text-3xl" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Check do dia</h3>
          <p className="text-xs mt-0.5 capitalize font-mono"
            style={{ color: 'color-mix(in srgb, var(--text) 35%, transparent)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <span className="flex items-center gap-2"><Plus size={15} /> Novo Hábito</span>
        </Button>
      </div>

      {/* Habits list */}
      {habits.length === 0 ? (
        <EmptyState icon={Flame} title="Nenhum hábito cadastrado" description="Adicione seu primeiro hábito" />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          initial="initial" animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>
            {habits.map((habit) => {
              const done = habit.completedDates.includes(todayStr);
              return (
                <motion.div
                  key={habit.id}
                  layout
                  variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative flex items-center gap-4 p-4 rounded-2xl border group cursor-pointer transition-all"
                  style={{
                    background: done ? habit.color + '0D' : 'var(--bg-soft)',
                    borderColor: done ? habit.color + '40' : 'var(--border)',
                  }}
                  onClick={() => toggleHabit(habit.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Color bar */}
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                    style={{ backgroundColor: habit.color }} />

                  {/* Check button */}
                  <motion.div
                    animate={{ scale: done ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }}
                  >
                    {done
                      ? <CheckCircle2 size={22} style={{ color: habit.color }} />
                      : <Circle size={22} style={{ color: 'color-mix(in srgb, var(--text) 20%, transparent)' }} />
                    }
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon}</span>
                      <span className={`font-medium text-sm ${done ? 'line-through opacity-50' : ''}`}
                        style={{ color: 'var(--text)' }}>
                        {habit.name}
                      </span>
                    </div>
                    {habit.streak > 0 && (
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--amber)' }}>
                        🔥 {habit.streak} {habit.streak === 1 ? 'dia' : 'dias'} de streak
                      </p>
                    )}
                  </div>

                  <motion.button
                    onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-accent-rose/15 hover:text-accent-rose transition-all"
                    style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Weekly grid */}
      {habits.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Histórico — 7 dias</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 min-w-[120px]"
                    style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>Hábito</th>
                  {last7.map((d, i) => (
                    <th key={d} className="text-center pb-2 px-1 font-mono"
                      style={{ color: d === todayStr ? 'var(--green)' : 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
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
                      <span>{habit.icon}</span>{' '}
                      <span style={{ color: 'color-mix(in srgb, var(--text) 60%, transparent)' }}>{habit.name}</span>
                    </td>
                    {last7.map((d) => {
                      const done = habit.completedDates.includes(d);
                      return (
                        <td key={d} className="text-center py-1 px-1">
                          <motion.div
                            className="w-6 h-6 rounded-lg mx-auto"
                            style={{
                              backgroundColor: done ? habit.color + '30' : 'var(--bg-muted)',
                              border: `1px solid ${done ? habit.color + '60' : 'var(--border)'}`,
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
          <Input label="Nome *" placeholder="Ex: Ler 30 minutos"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} autoFocus />
          <div>
            <span className="label block mb-2">ÍCONE</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <motion.button key={icon} onClick={() => setForm({ ...form, icon })}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                  className="text-xl p-2 rounded-xl border transition-colors"
                  style={{
                    borderColor: form.icon === icon ? 'var(--green)' : 'var(--border)',
                    background:  form.icon === icon ? 'rgba(200,241,53,0.1)' : 'var(--bg-muted)',
                  }}>
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <span className="label block mb-2">COR</span>
            <div className="flex gap-2">
              {COLORS.map(({ value }) => (
                <motion.button key={value} onClick={() => setForm({ ...form, color: value })}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: value,
                    borderColor: form.color === value ? 'white' : 'transparent',
                    transform: form.color === value ? 'scale(1.1)' : '',
                  }} />
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
