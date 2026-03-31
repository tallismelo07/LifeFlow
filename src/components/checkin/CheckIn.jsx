// src/components/checkin/CheckIn.jsx — Check-in Diário

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2, Circle, BookOpen, CalendarCheck,
  Briefcase, SmilePlus, BedDouble, Handshake,
  Pencil, Loader2,
} from 'lucide-react';

// ── Perguntas do check-in ─────────────────────────────────────
const QUESTIONS = [
  { key: 'produtividade', label: 'Trabalho produtivo?',  desc: 'Você foi produtivo hoje?',          Icon: Briefcase  },
  { key: 'dia_bom',       label: 'O dia foi bom?',       desc: 'Você está satisfeito com o dia?',   Icon: SmilePlus  },
  { key: 'dormiu_bem',    label: 'Dormiu bem?',           desc: 'Você descansou bem na noite passada?', Icon: BedDouble  },
  { key: 'promessas',     label: 'Cumpriu promessas?',    desc: 'Você honrou seus compromissos hoje?',  Icon: Handshake  },
];

const BLANK = {
  produtividade: false,
  dia_bom:       false,
  dormiu_bem:    false,
  promessas:     false,
  diario:        '',
};

// ── Toggle button ─────────────────────────────────────────────
function ToggleQuestion({ question, value, onChange }) {
  const { label, desc, Icon } = question;
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!value)}
      whileTap={{ scale: 0.97 }}
      style={{
        width:        '100%',
        display:      'flex',
        alignItems:   'center',
        gap:          14,
        padding:      '14px 16px',
        borderRadius: 14,
        border:       `1.5px solid ${value ? 'var(--green-border)' : 'var(--border)'}`,
        background:   value ? 'var(--green-bg)' : 'var(--bg-soft)',
        cursor:       'pointer',
        transition:   'border-color 0.15s, background 0.15s',
        textAlign:    'left',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:          36,
          height:         36,
          borderRadius:   10,
          background:     value ? 'var(--green)' : 'var(--bg-muted)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          transition:     'background 0.15s',
        }}
      >
        <Icon size={17} style={{ color: value ? 'var(--on-blue)' : 'var(--text-4)' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
          {label}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{desc}</p>
      </div>

      {/* Check indicator */}
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="yes"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          >
            <CheckCircle2 size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
          </motion.div>
        ) : (
          <motion.div
            key="no"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Circle size={22} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Score ring ────────────────────────────────────────────────
function ScoreRing({ form }) {
  const keys  = QUESTIONS.map((q) => q.key);
  const score = keys.filter((k) => form[k]).length;
  const pct   = (score / keys.length) * 100;

  const color = pct === 100 ? 'var(--green)'
              : pct >= 50   ? 'var(--amber)'
              :               'var(--text-4)';

  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle cx={35} cy={35} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle
          cx={35} cy={35} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text x={35} y={35} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 16, fontWeight: 800, fill: 'var(--text)', fontFamily: 'inherit' }}>
          {score}/{keys.length}
        </text>
      </svg>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {score === 4 ? 'Dia perfeito! 🎉'
           : score === 3 ? 'Quase lá!'
           : score === 2 ? 'Metade do caminho'
           : score === 1 ? 'Começou bem'
           : 'Marque seus pontos'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
          {4 - score > 0 ? `${4 - score} ${4 - score === 1 ? 'item' : 'itens'} restante${4 - score === 1 ? '' : 's'}` : 'Todos marcados!'}
        </p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function CheckIn() {
  const today = new Date().toISOString().split('T')[0];
  const { show } = useToast();

  const [form,     setForm]     = useState(BLANK);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [editing,  setEditing]  = useState(false);

  // Formata a data de hoje
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Carrega check-in existente
  useEffect(() => {
    api.get('/checkins')
      .then((r) => {
        const existing = (r.data.checkins || []).find((c) => c.date === today);
        if (existing) {
          setForm({
            produtividade: Boolean(existing.produtividade),
            dia_bom:       Boolean(existing.dia_bom),
            dormiu_bem:    Boolean(existing.dormiu_bem),
            promessas:     Boolean(existing.promessas),
            diario:        existing.diario || '',
          });
          setDone(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const toggle = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/checkins', { date: today, ...form });
      show('Check-in salvo com sucesso! ✨', 'success');
      setDone(true);
      setEditing(false);
    } catch {
      show('Erro ao salvar check-in. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = done && !editing;

  if (loading) {
    return (
      <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={22} style={{ color: 'var(--text-4)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div style={{ padding: '24px 20px 40px', maxWidth: 560, margin: '0 auto' }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CalendarCheck size={16} style={{ color: 'var(--blue)' }} />
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-4)' }}>
              Check-in Diário
            </p>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: 4 }}>
            Como foi seu dia?
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', textTransform: 'capitalize' }}>{todayLabel}</p>
        </div>

        {/* ── Done banner ───────────────────────────────────── */}
        <AnimatePresence>
          {done && !editing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                padding:      '12px 16px',
                background:   'var(--green-bg)',
                border:       '1px solid var(--green-border)',
                borderRadius: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                  Check-in do dia concluído!
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          4,
                  fontSize:     12,
                  color:        'var(--text-3)',
                  background:   'none',
                  border:       'none',
                  cursor:       'pointer',
                  padding:      '4px 8px',
                  borderRadius: 8,
                }}
              >
                <Pencil size={12} /> Editar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Score ring ───────────────────────────────────── */}
        <div
          style={{
            background:   'var(--bg-soft)',
            border:       '1px solid var(--border)',
            borderRadius: 16,
            padding:      '16px',
            marginBottom: 16,
          }}
        >
          <ScoreRing form={form} />
        </div>

        {/* ── Questions ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {QUESTIONS.map((q, i) => (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.05 }}
            >
              <ToggleQuestion
                question={q}
                value={form[q.key]}
                onChange={isReadOnly ? () => {} : (val) => toggle(q.key, val)}
              />
            </motion.div>
          ))}
        </div>

        {/* ── Diário ───────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              fontSize:     11,
              fontWeight:   600,
              textTransform:'uppercase',
              letterSpacing:'0.06em',
              color:        'var(--text-4)',
              marginBottom: 8,
            }}
          >
            <BookOpen size={11} /> Diário do dia
          </label>
          <textarea
            value={form.diario}
            onChange={(e) => !isReadOnly && setForm((f) => ({ ...f, diario: e.target.value }))}
            readOnly={isReadOnly}
            placeholder="Escreva aqui o seu dia… como você se sentiu, o que aconteceu, o que aprendeu."
            rows={5}
            style={{
              width:        '100%',
              background:   'var(--bg-soft)',
              border:       '1.5px solid var(--border)',
              borderRadius: 14,
              padding:      '14px',
              color:        'var(--text)',
              fontSize:     14,
              lineHeight:   1.6,
              resize:       'vertical',
              outline:      'none',
              fontFamily:   'inherit',
              boxSizing:    'border-box',
              opacity:      isReadOnly ? 0.7 : 1,
              cursor:       isReadOnly ? 'default' : 'text',
              transition:   'border-color 0.15s',
            }}
            onFocus={(e) => { if (!isReadOnly) e.target.style.borderColor = 'var(--blue)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* ── Botão ────────────────────────────────────────── */}
        {!isReadOnly && (
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
              padding:        '14px',
              background:     'var(--blue)',
              color:          'var(--on-blue)',
              border:         'none',
              borderRadius:   14,
              fontSize:       15,
              fontWeight:     700,
              cursor:         saving ? 'not-allowed' : 'pointer',
              opacity:        saving ? 0.7 : 1,
              transition:     'opacity 0.15s',
            }}
          >
            {saving ? (
              <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CalendarCheck size={17} />
            )}
            {editing ? 'Atualizar Check-in' : 'Finalizar Dia'}
          </motion.button>
        )}

        {/* Cancel edit */}
        {editing && (
          <button
            onClick={() => setEditing(false)}
            style={{
              marginTop:  10,
              width:      '100%',
              padding:    '10px',
              background: 'none',
              border:     '1px solid var(--border)',
              borderRadius: 12,
              color:      'var(--text-3)',
              fontSize:   13,
              cursor:     'pointer',
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </motion.div>
  );
}
