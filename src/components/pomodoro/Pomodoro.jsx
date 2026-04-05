// src/components/pomodoro/Pomodoro.jsx — v2
// Visual clean, minimalista, centralizado

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// ── Formata segundos → MM:SS ────────────────────────────────
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ── Web Audio — sons simples sem arquivos externos ───────────
function createAudioCtx() {
  try { return new (window.AudioContext || window['webkitAudioContext'])(); } catch { return null; }
}

function playSound(type) {
  const ctx = createAudioCtx();
  if (!ctx) return;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (type === 'sino') {
    // Sino: onda senoidal suave com decay
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } else if (type === 'digital') {
    // Digital: beep curto e limpo
    [0, 0.15, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 660;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.1);
    });
  } else {
    // Calmo: tom suave duplo
    [440, 550].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.4;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }
}

// ── Constantes ───────────────────────────────────────────────
const DEFAULT_MINS = { foco: 25, pausa: 5, rounds: 4 };

export default function Pomodoro() {
  const [mins,      setMins]      = useState(DEFAULT_MINS);
  const [mode,      setMode]      = useState('foco');   // 'foco' | 'pausa'
  const [timeLeft,  setTimeLeft]  = useState(DEFAULT_MINS.foco * 60);
  const [running,   setRunning]   = useState(false);
  const [sessions,  setSessions]  = useState(0);
  const [totalMin,  setTotalMin]  = useState(0);
  const [sound,     setSound]     = useState('sino');
  const [history,   setHistory]   = useState([]);       // { type, mins, ts }

  const intervalRef = useRef(null);

  const totalSecs  = (mode === 'foco' ? mins.foco : mins.pausa) * 60;
  const progress   = (totalSecs - timeLeft) / totalSecs;

  // ── Tick ──────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            onComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const onComplete = useCallback(() => {
    playSound(sound);
    if (Notification.permission === 'granted') {
      new Notification(mode === 'foco' ? '✅ Foco concluído!' : '☕ Pausa terminada!',
        { body: mode === 'foco' ? 'Hora de descansar.' : 'Hora de focar.' });
    }
    if (mode === 'foco') {
      setSessions((s) => s + 1);
      setTotalMin((m) => m + mins.foco);
      setHistory((h) => [{ type: 'foco', mins: mins.foco, ts: new Date() }, ...h].slice(0, 20));
      switchMode('pausa');
    } else {
      switchMode('foco');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mins, sessions, sound]);

  const switchMode = (m) => {
    setMode(m);
    setTimeLeft((m === 'foco' ? mins.foco : mins.pausa) * 60);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft((mode === 'foco' ? mins.foco : mins.pausa) * 60);
  };

  const toggleRun = () => {
    if (Notification.permission === 'default') Notification.requestPermission();
    setRunning((r) => !r);
  };

  // Atualiza tempo ao mudar minutos (se parado)
  const updateMins = (key, val) => {
    const next = { ...mins, [key]: val };
    setMins(next);
    if (!running) setTimeLeft((mode === 'foco' ? next.foco : next.pausa) * 60);
  };

  // Anel SVG
  const R       = 100;
  const CIRC    = 2 * Math.PI * R;
  const dashOff = CIRC * (1 - progress);

  const label = mode === 'foco' ? 'Foco' : 'Pausa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '32px 24px 60px', maxWidth: 520, margin: '0 auto' }}
    >

      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Pomodoro
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-4)', marginTop: 6 }}>
          Foco absoluto.
        </p>
      </div>

      {/* ── Seletor de modo ───────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center',
        background: 'var(--bg-muted)', padding: 4, borderRadius: 14,
        marginBottom: 40,
      }}>
        {[
          { id: 'foco',  label: 'Foco' },
          { id: 'pausa', label: 'Pausa' },
        ].map(({ id, label: lbl }) => (
          <button
            key={id}
            onClick={() => switchMode(id)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: 'none',
              background: mode === id ? '#ffffff' : 'transparent',
              color: mode === id ? 'var(--text)' : 'var(--text-4)',
              boxShadow: mode === id ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Timer ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        {/* Anel */}
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          <svg width="240" height="240" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="120" cy="120" r={R} fill="none"
              stroke="var(--border-md)" strokeWidth="6" />
            <circle cx="120" cy="120" r={R} fill="none"
              stroke="var(--text)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOff}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={`${mode}-${running}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: 52, fontWeight: 700,
                  color: 'var(--text)', letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}
              >
                {fmt(timeLeft)}
              </motion.span>
            </AnimatePresence>
            <span style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 6, fontWeight: 500 }}>
              {label}
            </span>
          </div>
        </div>

        {/* Sessões */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {Array.from({ length: mins.rounds }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < sessions % mins.rounds
                ? 'var(--text)' : 'var(--border-md)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* ── Controles ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 20, marginBottom: 48,
      }}>
        {/* Reset */}
        <button
          onClick={reset}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg-muted)', border: '1px solid var(--border-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-4)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-4)'}
        >
          <RotateCcw size={16} />
        </button>

        {/* Play / Pause — botão grande, preto */}
        <motion.button
          onClick={toggleRun}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--text)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: 'var(--shadow-md)',
          }}
        >
          {running
            ? <Pause size={26} style={{ color: '#ffffff' }} fill="#ffffff" />
            : <Play  size={26} style={{ color: '#ffffff', marginLeft: 3 }} fill="#ffffff" />
          }
        </motion.button>

        {/* Placeholder de simetria */}
        <div style={{ width: 44, height: 44 }} />
      </div>

      {/* ── Configurações ─────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid var(--border-md)',
        borderRadius: 18, padding: '24px 24px 20px', marginBottom: 24,
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--text-4)', marginBottom: 20 }}>
          Configurações
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { key: 'foco',   label: 'Foco',   min: 1, max: 90  },
            { key: 'pausa',  label: 'Pausa',  min: 1, max: 30  },
            { key: 'rounds', label: 'Rounds', min: 1, max: 12  },
          ].map(({ key, label: lbl, min, max }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>{lbl}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {mins[key]}{key !== 'rounds' ? ' min' : '×'}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={mins[key]}
                onChange={(e) => updateMins(key, Number(e.target.value))}
                style={{
                  width: '100%', appearance: 'none', height: 4,
                  borderRadius: 99, background: `linear-gradient(to right, var(--text) ${((mins[key] - min) / (max - min)) * 100}%, var(--border-md) 0%)`,
                  outline: 'none', cursor: 'pointer',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Som ───────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid var(--border-md)',
        borderRadius: 18, padding: '20px 24px', marginBottom: 24,
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--text-4)', marginBottom: 14 }}>
          Som de alerta
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'sino',    label: 'Sino'    },
            { id: 'digital', label: 'Digital' },
            { id: 'calmo',   label: 'Calmo'   },
          ].map(({ id, label: lbl }) => (
            <button
              key={id}
              onClick={() => { setSound(id); playSound(id); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${sound === id ? 'var(--text)' : 'var(--border-md)'}`,
                background: sound === id ? 'var(--text)' : '#ffffff',
                color: sound === id ? '#ffffff' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Histórico ─────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid var(--border-md)',
        borderRadius: 18, padding: '20px 24px',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--text-4)', marginBottom: 14 }}>
          Histórico de hoje
        </p>

        {history.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-4)', textAlign: 'center', padding: '8px 0' }}>
            Nenhuma sessão registrada ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
                  Sessão de foco — {h.mins} min
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-4)', fontFamily: 'monospace' }}>
                  {h.ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {sessions > 0 && (
          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-md)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Total de foco</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {totalMin} min · {sessions} {sessions === 1 ? 'sessão' : 'sessões'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
