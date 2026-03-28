// src/components/agenda/Agenda.jsx — agenda estilo Google Calendar

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Modal, Input, Textarea, Button, EmptyState } from '../ui';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Pencil,
  Calendar, Clock, AlignLeft,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const isoDate = (d) => d.toISOString().split('T')[0];
const sameDay = (iso, date) => iso.startsWith(isoDate(date));

const EVENT_COLORS = [
  { label: 'Azul',    value: 'var(--blue)' },
  { label: 'Verde',   value: 'var(--green)' },
  { label: 'Rosa',    value: 'var(--red)' },
  { label: 'Âmbar',  value: 'var(--amber)' },
  { label: 'Teal',   value: 'var(--teal)' },
  { label: 'Roxo',   value: 'var(--violet)' },
];

const BLANK_EVENT = { title: '', date: '', startTime: '09:00', endTime: '10:00', description: '', color: 'var(--blue)' };

// ── Week view helpers ─────────────────────────────────────────────────────────
const getWeekDays = (date) => {
  const start = new Date(date);
  const day   = start.getDay();
  start.setDate(start.getDate() - day); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

export default function Agenda() {
  const { agenda, addEvent, updateEvent, deleteEvent } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView]               = useState('day'); // 'day' | 'week'
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(BLANK_EVENT);

  // ── navigation ───────────────────────────────────────────────────────────
  const go = (dir) => {
    const d = new Date(currentDate);
    if (view === 'day')  d.setDate(d.getDate() + dir);
    else                  d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  // Events for current day / week
  const todayStr = isoDate(new Date());
  const isToday  = (d) => isoDate(d) === todayStr;

  const dayEvents = (date) =>
    agenda
      .filter((e) => sameDay(e.date, date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

  const currentDayEvents = dayEvents(currentDate);
  const weekDays         = getWeekDays(currentDate);

  // ── modal ────────────────────────────────────────────────────────────────
  const openCreate = (date = null) => {
    const d = date || currentDate;
    const dateStr = isoDate(d);
    setEditTarget(null);
    setForm({ ...BLANK_EVENT, date: dateStr });
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditTarget(ev.id);
    setForm({
      title:       ev.title,
      date:        isoDate(new Date(ev.date)),
      startTime:   fmtTime(ev.date),
      endTime:     ev.endTime || '',
      description: ev.description || '',
      color:       ev.color || 'var(--blue)',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    const [h, m] = form.startTime.split(':').map(Number);
    const dateObj = new Date(form.date + 'T00:00:00');
    dateObj.setHours(h, m, 0, 0);

    const payload = {
      title:       form.title.trim(),
      date:        dateObj.toISOString(),
      endTime:     form.endTime,
      description: form.description.trim(),
      color:       form.color,
    };

    if (editTarget) updateEvent(editTarget, payload);
    else            addEvent(payload);
    setModalOpen(false);
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}} className="p-6 lg:p-8 space-y-5 ">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream/50 hover:text-cream transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToday} className="text-sm font-medium text-cream/60 hover:text-cream transition-colors px-3 py-2 rounded-xl hover:bg-white/5">
            Hoje
          </button>
          <button onClick={() => go(1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream/50 hover:text-cream transition-colors">
            <ChevronRight size={16} />
          </button>

          <div>
            <p className="font-bold text-lg text-cream capitalize leading-tight">
              {view === 'day'
                ? currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                : `Semana de ${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
              }
            </p>
            {isToday(currentDate) && view === 'day' && (
              <span className="text-xs font-mono " style={{color:'var(--green)'}}>hoje</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-ink-muted p-1 rounded-xl gap-1">
            {['day', 'week'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={view === v
                  ? { background: 'var(--blue)', color: '#fff', fontWeight: 600 }
                  : { color: 'var(--text-3)' }
                }>
                {v === 'day' ? 'Dia' : 'Semana'}
              </button>
            ))}
          </div>
          <Button onClick={() => openCreate()}>
            <span className="flex items-center gap-2"><Plus size={15} /> Evento</span>
          </Button>
        </div>
      </div>

      {/* ── Day View ────────────────────────────────────────────────────── */}
      {view === 'day' && (
        <div className="space-y-3">
          {currentDayEvents.length === 0 ? (
            <EmptyState icon={Calendar} title="Sem eventos hoje" description="Clique em '+ Evento' para adicionar" />
          ) : (
            currentDayEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onEdit={() => openEdit(ev)} onDelete={() => deleteEvent(ev.id)} />
            ))
          )}
        </div>
      )}

      {/* ── Week View ───────────────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const evs   = dayEvents(d);
            const today = isToday(d);
            return (
              <div
                key={d.toISOString()}
                className="min-h-[160px] rounded-xl border p-2 flex flex-col gap-1.5 transition-all"
                style={today
                  ? { borderColor: 'var(--blue-border)', background: 'var(--blue-bg)' }
                  : { borderColor: 'var(--border)', background: 'var(--bg-soft)' }
                }
              >
                {/* Day header */}
                <div className="flex flex-col items-center pb-2 border-b border-white/6">
                  <span className="text-[10px] font-mono text-cream/30 uppercase">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className={`text-sm font-bold mt-0.5 ${today ? '' : 'text-cream/70'}`}>
                    {d.getDate()}
                  </span>
                </div>
                {/* Events */}
                {evs.map((ev) => (
                  <button key={ev.id} onClick={() => openEdit(ev)}
                    className="text-left rounded-lg px-2 py-1.5 text-[10px] font-medium leading-snug truncate hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: ev.color + '25', color: ev.color, border: `1px solid ${ev.color}40` }}
                  >
                    {fmtTime(ev.date)} {ev.title}
                  </button>
                ))}
                {/* Add btn */}
                <button onClick={() => openCreate(d)} className="mt-auto text-center text-[10px] text-cream/20 hover:text-cream/50 transition-colors py-1">
                  +
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Evento' : 'Novo Evento'}>
        <div className="space-y-4">
          <Input label="Título *" placeholder="Nome do evento" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label flex items-center gap-1.5"><Calendar size={11} /> DATA *</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-base" style={{ colorScheme: 'dark' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label flex items-center gap-1.5"><Clock size={11} /> HORÁRIO</label>
              <div className="flex gap-1 items-center">
                <input type="time" value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="input-base text-xs" style={{ colorScheme: 'dark' }} />
                <span className="text-cream/30 text-xs">–</span>
                <input type="time" value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="input-base text-xs" style={{ colorScheme: 'dark' }} />
              </div>
            </div>
          </div>

          <Textarea label="Descrição" placeholder="Detalhes do evento..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />

          {/* Color picker */}
          <div>
            <span className="label block mb-2">COR</span>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map(({ label, value }) => (
                <button key={value} title={label} onClick={() => setForm({ ...form, color: value })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: value }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleSave}>{editTarget ? 'Salvar' : 'Criar Evento'}</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// ── Event Card (day view) ────────────────────────────────────────────────────
function EventCard({ event, onEdit, onDelete }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl border group hover:opacity-95 transition-opacity"
      style={{ borderColor: event.color + '35', backgroundColor: event.color + '0D' }}
    >
      {/* Color bar */}
      <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: event.color }} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-cream text-sm">{event.title}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs font-mono" style={{ color: event.color }}>
            <Clock size={11} />
            {fmtTime(event.date)}{event.endTime ? ` – ${event.endTime}` : ''}
          </span>
        </div>
        {event.description && (
          <p className="text-xs text-cream/40 mt-2 flex items-start gap-1.5">
            <AlignLeft size={11} className="mt-0.5 shrink-0" />
            {event.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-cream/30 hover:text-cream transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-accent-rose/15 text-cream/30 hover:text-accent-rose transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
