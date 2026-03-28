// src/components/notes/Notes.jsx
// Notas rápidas com cores, pins e busca

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button, Modal, Input, EmptyState } from '../ui';
import { Plus, Trash2, Pin, PinOff, Search, StickyNote, Edit3 } from 'lucide-react';

const NOTE_COLORS = [
  '#C8F135', '#5B8DEF', '#2DD4BF', '#F5A623', '#F0556A', '#A78BFA', '#FB923C',
];

const BLANK = { title: '', content: '', color: '#C8F135', pinned: false };

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useApp();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [activeNote, setActiveNote] = useState(null); // nota aberta para edição inline

  // Filtra e ordena: pinned primeiro
  const filtered = notes
    .filter((n) => {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK);
    setModalOpen(true);
  };

  const openEdit = (note) => {
    setEditTarget(note.id);
    setForm({ title: note.title, content: note.content, color: note.color, pinned: note.pinned });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() && !form.content.trim()) return;
    if (editTarget) {
      updateNote(editTarget, form);
    } else {
      addNote(form);
    }
    setModalOpen(false);
  };

  return (
    <motion.div className="p-8 space-y-6" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/30" />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <Button onClick={openCreate}>
          <span className="flex items-center gap-2"><Plus size={16} /> Nova Nota</span>
        </Button>
      </div>

      {/* Pinned section */}
      {filtered.some((n) => n.pinned) && (
        <div>
          <p className="label mb-3">📌 FIXADAS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.filter((n) => n.pinned).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onDelete={() => deleteNote(note.id)}
                onTogglePin={() => updateNote(note.id, { pinned: !note.pinned })}
              />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {filtered.some((n) => !n.pinned) && (
        <div>
          <p className="label mb-3">OUTRAS NOTAS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.filter((n) => !n.pinned).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onDelete={() => deleteNote(note.id)}
                onTogglePin={() => updateNote(note.id, { pinned: !note.pinned })}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon={StickyNote}
          title={search ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
          description={search ? 'Tente outra busca' : 'Crie sua primeira nota rápida'}
        />
      )}

      {/* Modal criar/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar Nota' : 'Nova Nota'}
      >
        <div className="space-y-4">
          <Input
            label="Título"
            placeholder="Título da nota..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <span className="label">Conteúdo</span>
            <textarea
              className="input-base resize-none"
              rows={6}
              placeholder="Escreva sua nota aqui..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          {/* Seletor de cor */}
          <div>
            <span className="label block mb-2">Cor</span>
            <div className="flex gap-2 flex-wrap">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    form.color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c + '50' , borderColor: form.color === c ? c : 'transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}40` : '' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>
              {editTarget ? 'Salvar' : 'Criar'}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// ── Note Card ─────────────────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.content.length > 150;

  return (
    <div
      className="relative flex flex-col rounded-2xl border p-4 transition-all duration-200 group hover:shadow-lg"
      style={{
        borderColor: note.color + '30',
        backgroundColor: note.color + '08',
      }}
    >
      {/* Color accent top */}
      <div
        className="absolute top-0 left-4 right-4 h-0.5 rounded-full opacity-60"
        style={{ backgroundColor: note.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2 mt-1">
        <h4 className="font-display font-semibold text-sm text-cream flex-1 leading-snug">
          {note.title || <span className="text-cream/30 italic">Sem título</span>}
        </h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onTogglePin}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: note.pinned ? note.color : 'rgba(245,240,232,0.3)' }}
          >
            {note.pinned ? <Pin size={12} /> : <PinOff size={12} />}
          </button>
          <button
            onClick={onEdit}
            className="p-1 rounded-lg hover:bg-white/10 text-cream/30 hover:text-cream transition-colors"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-lg hover:bg-red-500/20 text-cream/30 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-cream/60 leading-relaxed whitespace-pre-wrap flex-1">
        {isLong && !expanded
          ? note.content.slice(0, 150) + '…'
          : note.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs mt-2 self-start font-mono hover:underline"
          style={{ color: note.color }}
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}

      {/* Footer */}
      <p className="text-xs font-mono text-cream/20 mt-3">
        {new Date(note.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
      </p>
    </div>
  );
}
