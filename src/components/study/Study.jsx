// src/components/study/Study.jsx
// Rastreamento de estudos: progresso, anotações, status

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Card, Button, Input, Textarea, Select, Modal, Badge, Progress, EmptyState } from '../ui';
import { Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  studying: { label: 'Estudando', color: 'blue',  bg: 'studying' },
  completed: { label: 'Concluído', color: 'green', bg: 'completed' },
  queued:   { label: 'Na fila',   color: 'gray',  bg: 'queued'   },
  paused:   { label: 'Pausado',   color: 'amber', bg: 'paused'   },
};

const BLANK = {
  title: '', description: '', status: 'studying',
  progress: 0, tags: '', notes: '', resources: '',
};

export default function Study() {
  const { studyItems, addStudyItem, updateStudyItem, deleteStudyItem } = useApp();

  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [expandedId, setExpandedId] = useState(null);

  // Filtro
  const filtered = studyItems.filter((s) => statusFilter === 'all' || s.status === statusFilter);

  // Estatísticas
  const total = studyItems.length;
  const studying = studyItems.filter((s) => s.status === 'studying').length;
  const completed = studyItems.filter((s) => s.status === 'completed').length;

  const openModal = (item = null) => {
    if (item) {
      setEditTarget(item.id);
      setForm({
        title: item.title,
        description: item.description,
        status: item.status,
        progress: item.progress,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
        notes: item.notes || '',
        resources: item.resources || '',
      });
    } else {
      setEditTarget(null);
      setForm(BLANK);
    }
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      progress: Number(form.progress),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (editTarget) {
      updateStudyItem(editTarget, payload);
    } else {
      addStudyItem(payload);
    }
    setModalOpen(false);
  };

  const updateProgress = (id, value) => {
    updateStudyItem(id, {
      progress: value,
      status: value >= 100 ? 'completed' : undefined,
    });
  };

  return (
    <motion.div className="p-8 space-y-6" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="label mb-2">EM ANDAMENTO</p>
          <p className="font-display font-bold text-3xl text-accent-blue">{studying}</p>
        </Card>
        <Card className="text-center">
          <p className="label mb-2">CONCLUÍDOS</p>
          <p className="font-bold text-3xl" style={{color:"var(--green)"}}>{completed}</p>
        </Card>
        <Card className="text-center">
          <p className="label mb-2">TOTAL</p>
          <p className="font-display font-bold text-3xl text-cream/70">{total}</p>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'studying', 'queued', 'paused', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs font-mono px-3 py-1.5 rounded-xl border transition-all"
              style={statusFilter === s
                ? { background: 'var(--blue-bg)', color: 'var(--blue)', borderColor: 'var(--blue-border)' }
                : { background: 'var(--bg-muted)', color: 'var(--text-3)', borderColor: 'var(--border-md)' }
              }
            >
              {s === 'all'
                ? 'Todos'
                : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
        <Button onClick={() => openModal()}>
          <span className="flex items-center gap-2"><Plus size={16} /> Adicionar</span>
        </Button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="Nenhum item aqui" description="Adicione algo que está estudando" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <StudyCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onEdit={() => openModal(item)}
              onDelete={() => deleteStudyItem(item.id)}
              onProgressChange={(v) => updateProgress(item.id, v)}
              onNoteChange={(notes) => updateStudyItem(item.id, { notes })}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Item' : 'Novo Estudo'}>
        <div className="space-y-4">
          <Input
            label="Título *"
            placeholder="Ex: React Avançado"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Descrição"
            placeholder="O que você está aprendendo?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
            <div className="flex flex-col gap-1.5">
              <span className="label">Progresso: {form.progress}%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full accent-blue"
              />
            </div>
          </div>
          <Input
            label="Tags (separadas por vírgula)"
            placeholder="React, Frontend, Hooks"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <Input
            label="Recursos / Links"
            placeholder="https://..."
            value={form.resources}
            onChange={(e) => setForm({ ...form, resources: e.target.value })}
          />
          <Textarea
            label="Anotações"
            placeholder="O que você aprendeu?"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
          />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>
              {editTarget ? 'Salvar' : 'Adicionar'}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// ── Study Card ─────────────────────────────────────────────────────────────────
const STATUS_BG = {
  studying: { background: 'var(--blue-bg)',   border: '1px solid var(--blue-border)'  },
  completed: { background: 'var(--green-bg)',  border: '1px solid var(--green-border)' },
  queued:   { background: 'var(--bg-muted)',  border: '1px solid var(--border-md)'    },
  paused:   { background: 'var(--amber-bg)',  border: '1px solid var(--amber-border)' },
};

function StudyCard({ item, expanded, onExpand, onEdit, onDelete, onProgressChange, onNoteChange }) {
  const { label, color } = STATUS_CONFIG[item.status] || STATUS_CONFIG.queued;
  const bgStyle = STATUS_BG[item.status] || STATUS_BG.queued;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={bgStyle}
    >
      {/* Header */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={onExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display font-semibold text-cream text-base">{item.title}</span>
            <Badge color={color}>{label}</Badge>
          </div>
          {item.description && (
            <p className="text-xs text-cream/40 mb-2 truncate">{item.description}</p>
          )}
          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs font-mono bg-white/8 text-cream/40 px-2 py-0.5 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={item.progress} color={color === 'lime' ? 'var(--green)' : color === 'blue' ? 'var(--blue)' : 'var(--amber)'} className="flex-1" />
            <span className="text-xs font-mono text-cream/40 shrink-0">{item.progress}%</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-white/10 text-cream/30 hover:text-cream transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-accent-rose/15 text-cream/30 hover:text-accent-rose transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <div className="text-cream/20 ml-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expandido: anotações + ajuste de progresso */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/8 pt-4 space-y-4">
          {/* Slider de progresso inline */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="label">AJUSTAR PROGRESSO</span>
              <span className="text-xs font-mono text-cream/50">{item.progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={item.progress}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              className="w-full accent-blue"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Anotações inline */}
          <div>
            <span className="label block mb-2">📝 O QUE APRENDI HOJE</span>
            <textarea
              className="input-base resize-none text-sm"
              rows={4}
              placeholder="Escreva suas anotações do dia..."
              value={item.notes || ''}
              onChange={(e) => onNoteChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Recursos */}
          {item.resources && (
            <div>
              <span className="label block mb-1">🔗 RECURSOS</span>
              <a
                href={item.resources.startsWith('http') ? item.resources : `https://${item.resources}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent-blue hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {item.resources}
              </a>
            </div>
          )}

          <p className="text-xs font-mono text-cream/20">
            Atualizado: {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
