// src/components/goals/Goals.jsx
// Metas financeiras e pessoais com progresso visual

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Textarea, Select, Modal, Progress, EmptyState } from '../ui';
import { Plus, Trash2, Pencil, Target, PlusCircle, MinusCircle } from 'lucide-react';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const GOAL_COLORS = [
  { label: 'Lima', value: 'var(--green)' },
  { label: 'Azul', value: 'var(--blue)' },
  { label: 'Âmbar', value: 'var(--amber)' },
  { label: 'Rosa', value: 'var(--red)' },
  { label: 'Teal', value: 'var(--teal)' },
];

const CATEGORIES = ['Financeiro', 'Tecnologia', 'Viagem', 'Educação', 'Saúde', 'Outros'];

const BLANK = { title: '', description: '', target: '', current: '', category: 'Financeiro', deadline: '', color: 'var(--green)' };

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [depositModal, setDepositModal] = useState(null); // id da meta
  const [depositAmount, setDepositAmount] = useState('');

  // Stats
  const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current), 0);
  const completed = goals.filter((g) => g.current >= g.target).length;

  const openCreate = () => { setEditTarget(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (goal) => {
    setEditTarget(goal.id);
    setForm({ ...goal, target: goal.target.toString(), current: goal.current.toString(), deadline: goal.deadline?.split('T')[0] || '' });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.target) return;
    const payload = { ...form, target: Number(form.target), current: Number(form.current) || 0 };
    if (editTarget) updateGoal(editTarget, payload);
    else addGoal(payload);
    setModalOpen(false);
  };

  const handleDeposit = (add) => {
    const val = Number(depositAmount);
    if (!val || !depositModal) return;
    const goal = goals.find((g) => g.id === depositModal);
    if (!goal) return;
    const newCurrent = add ? goal.current + val : Math.max(0, goal.current - val);
    updateGoal(depositModal, { current: newCurrent });
    setDepositModal(null);
    setDepositAmount('');
  };

  return (
    <motion.div className="p-8 space-y-6" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="label mb-2">METAS ATIVAS</p>
          <p className="font-bold text-3xl" style={{color:"var(--blue)"}}>{goals.length}</p>
        </Card>
        <Card className="text-center">
          <p className="label mb-2">CONCLUÍDAS</p>
          <p className="font-display font-bold text-3xl text-accent-teal">{completed}</p>
        </Card>
        <Card className="text-center">
          <p className="label mb-2">TOTAL GUARDADO</p>
          <p className="font-display font-bold text-lg text-accent-amber">{fmt(totalSaved)}</p>
          <p className="text-xs text-current opacity-40 mt-0.5">de {fmt(totalTarget)}</p>
        </Card>
      </div>

      {/* Header ação */}
      <div className="flex items-center justify-between">
        <h3 className="section-title">Minhas Metas</h3>
        <Button onClick={openCreate}>
          <span className="flex items-center gap-2"><Plus size={16} /> Nova Meta</span>
        </Button>
      </div>

      {/* Lista de metas */}
      {goals.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta cadastrada" description="Crie uma meta para acompanhar seu progresso" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => openEdit(goal)}
              onDelete={() => deleteGoal(goal.id)}
              onDeposit={() => { setDepositModal(goal.id); setDepositAmount(''); }}
            />
          ))}
        </div>
      )}

      {/* Modal criar/editar meta */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Meta' : 'Nova Meta'}>
        <div className="space-y-4">
          <Input label="Título *" placeholder="Ex: Reserva de emergência" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Descrição" placeholder="Detalhes da meta..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor Alvo (R$) *" type="number" min="0" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            <Input label="Valor Atual (R$)" type="number" min="0" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Prazo" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <span className="label block mb-2">Cor</span>
            <div className="flex gap-2">
              {GOAL_COLORS.map(({ value }) => (
                <button key={value} onClick={() => setForm({ ...form, color: value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === value ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>{editTarget ? 'Salvar' : 'Criar Meta'}</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal depósito */}
      <Modal open={!!depositModal} onClose={() => setDepositModal(null)} title="Atualizar Saldo">
        <div className="space-y-4">
          <p className="text-sm text-current opacity-60">
            Meta: <span className="var-text font-medium">{goals.find((g) => g.id === depositModal)?.title}</span>
          </p>
          <Input label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleDeposit(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-teal/15 text-accent-teal font-display font-bold hover:bg-accent-teal/25 transition-colors"
            >
              <PlusCircle size={18} /> Adicionar
            </button>
            <button
              onClick={() => handleDeposit(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-rose/15 text-accent-rose font-display font-bold hover:bg-accent-rose/25 transition-colors"
            >
              <MinusCircle size={18} /> Remover
            </button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setDepositModal(null)}>Cancelar</Button>
        </div>
      </Modal>
    </motion.div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onDeposit }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const done = goal.current >= goal.target;

  // Dias restantes
  let daysLeft = null;
  if (goal.deadline) {
    const diff = Math.ceil((new Date(goal.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
    daysLeft = diff;
  }

  return (
    <div
      className="relative rounded-3xl border p-5 flex flex-col gap-4 group transition-all duration-200 hover:shadow-lg"
      style={{ borderColor: goal.color + '30', backgroundColor: goal.color + '06' }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-5 right-5 h-0.5 rounded-full opacity-40" style={{ backgroundColor: goal.color }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ color: goal.color, backgroundColor: goal.color + '20' }}>
              {goal.category}
            </span>
            {done && <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{background:"var(--green-bg)",color:"var(--green)",border:"1px solid var(--green-border)"}}>✅ Concluída</span>}
          </div>
          <h4 className="font-display font-bold var-text text-base leading-snug">{goal.title}</h4>
          {goal.description && <p className="text-xs var-text/40 mt-0.5 truncate">{goal.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-current opacity-40 hover:var-text transition-colors"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/15 text-current opacity-40 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Valores */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display font-bold text-2xl" style={{ color: goal.color }}>
            {fmt(goal.current)}
          </p>
          <p className="text-xs text-current opacity-40">de {fmt(goal.target)}</p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-xl var-text">{pct}%</p>
          {daysLeft !== null && (
            <p className={`text-xs font-mono ${daysLeft < 30 ? 'text-accent-rose' : 'text-current opacity-40'}`}>
              {daysLeft > 0 ? `${daysLeft}d restantes` : 'Vencida'}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 var(--bg-muted) rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: goal.color }}
        />
      </div>

      {/* Falta quanto */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-current opacity-40">
          Faltam <span className="text-current opacity-70">{fmt(Math.max(0, goal.target - goal.current))}</span>
        </p>
        {!done && (
          <button
            onClick={onDeposit}
            className="text-xs font-display font-semibold px-3 py-1.5 rounded-xl transition-colors"
            style={{ color: goal.color, backgroundColor: goal.color + '15' }}
          >
            + Depositar
          </button>
        )}
      </div>
    </div>
  );
}
