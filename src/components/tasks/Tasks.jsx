// src/components/tasks/Tasks.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Input, Textarea, Select, Modal, Badge, EmptyState, Progress } from '../ui';
import {
  Plus, Pencil, Trash2, CheckSquare, Circle, Clock,
  Zap, Check,
} from 'lucide-react';

// ── Status / Priority ─────────────────────────────────────────────────────────
const STATUS = {
  todo:       { label: 'Não comecei',  icon: Circle, css: 'status-todo',       dot: 'var(--text-4)' },
  inprogress: { label: 'Em andamento', icon: Zap,    css: 'status-inprogress', dot: 'var(--blue)'   },
  done:       { label: 'Concluído',    icon: Check,  css: 'status-done',       dot: 'var(--green)'  },
};

const PRIORITY = {
  high:   { label: 'Alta',  color: 'red',   dot: 'var(--red)'   },
  medium: { label: 'Média', color: 'amber', dot: 'var(--amber)' },
  low:    { label: 'Baixa', color: 'gray',  dot: 'var(--text-4)'},
};

const BLANK_TASK = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' };

// ── TaskItem ──────────────────────────────────────────────────────────────────
function TaskItem({ task, index, onToggle, onEdit, onDelete, onStatusChange }) {
  const priority = PRIORITY[task.priority] || PRIORITY.medium;
  const status   = STATUS[task.status] || STATUS.todo;
  const isDone   = task.status === 'done';
  const isInProg = task.status === 'inprogress';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="flex items-start gap-4 p-4 rounded-2xl border group"
      style={{
        background:   isDone ? 'color-mix(in srgb, var(--bg-soft) 60%, transparent)' : 'var(--bg-soft)',
        borderColor:  isInProg ? 'rgba(245,166,35,0.25)' : isDone ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'var(--border)',
        opacity:      isDone ? 0.7 : 1,
      }}
      whileHover={{ scale: 1.005 }}
    >
      <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: status.dot }} />
      <input type="checkbox" className="custom-checkbox mt-0.5 shrink-0" checked={isDone} onChange={onToggle} />

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${isDone ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text)' }}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <StatusBadge status={task.status} />
          <Badge color={priority.color}>{priority.label}</Badge>
          {task.dueDate && (
            <span className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
              <Clock size={10} />
              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {Object.entries(STATUS).map(([k, v]) => (
          <motion.button
            key={k}
            onClick={() => onStatusChange(k)}
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            title={v.label}
            className="w-5 h-5 rounded-full border-2 transition-all"
            style={{
              backgroundColor: task.status === k ? v.dot : 'transparent',
              borderColor: v.dot,
              opacity: task.status === k ? 1 : 0.4,
            }}
          />
        ))}
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
        <motion.button onClick={onEdit} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }}>
          <Pencil size={13} />
        </motion.button>
        <motion.button onClick={onDelete} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }}>
          <Trash2 size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.todo;
  const Icon = cfg.icon;
  return (
    <span className={`tag ${cfg.css} flex items-center gap-1`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useApp();

  const [statusFilter,   setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [form,           setForm]           = useState(BLANK_TASK);

  const normalizedTasks = tasks.map((t) => ({
    ...t, status: t.status || (t.completed ? 'done' : 'todo'),
  }));

  const filtered = normalizedTasks
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter)
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      const sOrder = { inprogress: 0, todo: 1, done: 2 };
      return sOrder[a.status] - sOrder[b.status] || pOrder[a.priority] - pOrder[b.priority];
    });

  const openModal = (task = null) => {
    if (task) {
      setEditTarget(task.id);
      setForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status || 'todo', dueDate: task.dueDate || '' });
    } else {
      setEditTarget(null);
      setForm(BLANK_TASK);
    }
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload = { ...form, completed: form.status === 'done' };
    if (editTarget) updateTask(editTarget, payload);
    else            addTask(payload);
    setModalOpen(false);
  };

  const total   = normalizedTasks.length;
  const done    = normalizedTasks.filter((t) => t.status === 'done').length;
  const inprog  = normalizedTasks.filter((t) => t.status === 'inprogress').length;
  const todo    = normalizedTasks.filter((t) => t.status === 'todo').length;
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-5">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <span className="label">PROGRESSO GERAL</span>
            <div className="flex gap-3 text-xs font-mono">
              <span style={{ color: 'var(--text-4)' }}>⚪ {todo} a fazer</span>
              <span style={{ color: 'var(--amber)' }}>⚡ {inprog} andamento</span>
              <span style={{ color: 'var(--green)' }}>✓ {done} concluídas</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={donePct} color="var(--green)" className="flex-1" />
            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--green)' }}>{donePct}%</span>
          </div>
        </div>
        <Button onClick={() => openModal()}>
          <span className="flex items-center gap-2"><Plus size={15} /> Nova Tarefa</span>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'todo',       label: 'A fazer',      count: todo,   color: 'var(--text-4)', bg: 'var(--bg-muted)' },
          { key: 'inprogress', label: 'Em andamento', count: inprog, color: 'var(--amber)',   bg: 'color-mix(in srgb, var(--amber) 8%, transparent)' },
          { key: 'done',       label: 'Concluídas',   count: done,   color: 'var(--green)',   bg: 'var(--green-bg)' },
        ].map((s) => (
          <motion.button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key)}
            className="p-3 rounded-xl border text-left transition-all"
            style={{
              background:   statusFilter === s.key ? s.bg : 'var(--bg-soft)',
              borderColor:  statusFilter === s.key ? s.color + '40' : 'var(--border)',
            }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <p className="font-bold text-2xl" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'todo', 'inprogress', 'done'].map((k) => (
          <button key={k} onClick={() => setStatusFilter(k)}
            className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
            style={statusFilter === k
              ? { background: 'var(--bg-raised)', color: 'var(--text)', borderColor: 'var(--border-md)' }
              : { background: 'transparent', color: 'var(--text-4)', borderColor: 'var(--border)' }
            }>
            {{ all: 'Todas', todo: 'A fazer', inprogress: 'Andamento', done: 'Concluídas' }[k]}
          </button>
        ))}
        <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />
        {['all', 'high', 'medium', 'low'].map((p) => (
          <button key={p} onClick={() => setPriorityFilter(p)}
            className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
            style={priorityFilter === p
              ? { background: 'var(--bg-raised)', color: 'var(--text)', borderColor: 'var(--border-md)' }
              : { background: 'transparent', color: 'var(--text-4)', borderColor: 'var(--border)' }
            }>
            {{ all: 'Prioridade', high: '🔴 Alta', medium: '🟡 Média', low: '⚪ Baixa' }[p]}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0
        ? <EmptyState icon={CheckSquare} title="Nenhuma tarefa aqui" description="Crie uma nova tarefa para começar" />
        : (
          <motion.div className="space-y-2" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((task, i) => (
                <TaskItem
                  key={task.id} task={task} index={i}
                  onToggle={() => toggleTask(task.id)}
                  onEdit={() => openModal(task)}
                  onDelete={() => deleteTask(task.id)}
                  onStatusChange={(s) => updateTask(task.id, { status: s, completed: s === 'done' })}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )
      }

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Tarefa' : 'Nova Tarefa'}>
        <div className="space-y-4">
          <Input label="Título *" placeholder="O que precisa ser feito?"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} autoFocus />
          <Textarea label="Descrição" placeholder="Detalhes opcionais..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            <Select label="Prioridade" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">🔴 Alta</option>
              <option value="medium">🟡 Média</option>
              <option value="low">⚪ Baixa</option>
            </Select>
          </div>
          <Input label="Vencimento" type="date" value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>{editTarget ? 'Salvar' : 'Criar Tarefa'}</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
