// src/components/pomodoro/Pomodoro.jsx
// Timer Pomodoro com sessões de foco, pausas curtas e longas

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Progress } from '../ui';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, Zap } from 'lucide-react';

const MODES = {
  focus:       { label: 'Foco',         minutes: 25, color: 'var(--green)', icon: Brain },
  shortBreak:  { label: 'Pausa Curta',  minutes: 5,  color: '#5B8DEF', icon: Coffee },
  longBreak:   { label: 'Pausa Longa',  minutes: 15, color: '#2DD4BF', icon: Coffee },
};

// Formata segundos em MM:SS
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Pomodoro() {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);         // Pomodoros completos
  const [totalFocusMin, setTotalFocusMin] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customMins, setCustomMins] = useState({ focus: 25, shortBreak: 5, longBreak: 15 });
  const [task, setTask] = useState('');

  const intervalRef = useRef(null);
  const startedAt = useRef(null);

  const totalSeconds = customMins[mode] * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const cfg = MODES[mode];
  const ModeIcon = cfg.icon;

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  // Ao completar sessão
  const handleComplete = useCallback(() => {
    if (mode === 'focus') {
      setSessions((s) => s + 1);
      setTotalFocusMin((m) => m + customMins.focus);
      // Notificação do browser
      if (Notification.permission === 'granted') {
        new Notification('🍅 Pomodoro concluído!', { body: 'Hora de descansar.' });
      }
    }
  }, [mode, customMins.focus]);

  const switchMode = (m) => {
    setMode(m);
    setTimeLeft(customMins[m] * 60);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(customMins[mode] * 60);
  };

  const requestNotifPermission = () => {
    if (Notification.permission === 'default') Notification.requestPermission();
  };

  // Atualiza tempo ao mudar configurações
  const applySettings = () => {
    setTimeLeft(customMins[mode] * 60);
    setRunning(false);
    setShowSettings(false);
  };

  // Circumference do anel SVG
  const R = 110;
  const circ = 2 * Math.PI * R;
  const strokeDash = circ - (progress / 100) * circ;

  return (
    <motion.div className="p-8 space-y-8 max-w-2xl mx-auto" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}}>

      {/* Seletor de modo */}
      <div className="flex gap-2 bg-ink-muted/50 p-1.5 rounded-2xl w-fit mx-auto">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-200 ${
              mode === key
                ? 'text-ink shadow-lg'
                : 'text-cream/40 hover:text-cream/70'
            }`}
            style={mode === key ? { backgroundColor: val.color } : {}}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer Ring */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <svg width="280" height="280" className="-rotate-90">
            {/* Track */}
            <circle
              cx="140" cy="140" r={R}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Progress */}
            <circle
              cx="140" cy="140" r={R}
              fill="none"
              stroke={cfg.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <ModeIcon size={20} style={{ color: cfg.color }} className="mb-2 opacity-70" />
            <span
              className="font-display font-bold text-6xl text-cream tabular-nums"
              style={{ letterSpacing: '-2px' }}
            >
              {fmt(timeLeft)}
            </span>
            <span className="text-xs font-mono text-cream/30 mt-2">{cfg.label}</span>
          </div>
        </div>

        {/* Tarefa atual */}
        <input
          type="text"
          placeholder="Em que você está trabalhando?"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="input-base text-center text-sm max-w-xs"
        />

        {/* Controles */}
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-cream/40 hover:text-cream transition-colors"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => { setRunning((r) => !r); requestNotifPermission(); }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-display font-bold text-ink text-lg transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: cfg.color }}
          >
            {running ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
            {running ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-cream/40 hover:text-cream transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="label mb-1">🍅 POMODOROS</p>
          <p className="font-display font-bold text-3xl " style={{color:'var(--green)'}}>{sessions}</p>
          <p className="text-xs text-cream/30 mt-1">hoje</p>
        </Card>
        <Card className="text-center">
          <p className="label mb-1">⏱ FOCO TOTAL</p>
          <p className="font-display font-bold text-3xl text-accent-blue">{totalFocusMin}</p>
          <p className="text-xs text-cream/30 mt-1">minutos</p>
        </Card>
        <Card className="text-center">
          <p className="label mb-1">🎯 PRÓXIMA</p>
          <p className="font-display font-bold text-sm text-cream/60 mt-2">
            {sessions > 0 && sessions % 4 === 0 ? 'Pausa longa!' : `Pomodoro ${sessions + 1}`}
          </p>
        </Card>
      </div>

      {/* Configurações */}
      {showSettings && (
        <Card className="animate-in">
          <h3 className="font-display font-semibold text-cream mb-4">⚙️ Configurações</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'focus', label: 'Foco (min)' },
              { key: 'shortBreak', label: 'Pausa Curta' },
              { key: 'longBreak', label: 'Pausa Longa' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <span className="label">{label}</span>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={customMins[key]}
                  onChange={(e) => setCustomMins({ ...customMins, [key]: Number(e.target.value) })}
                  className="input-base text-center"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <Button className="flex-1" onClick={applySettings}>Aplicar</Button>
            <Button variant="ghost" onClick={() => setShowSettings(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {/* Dica */}
      <div className="text-center">
        <p className="text-xs font-mono text-cream/20">
          A cada 4 pomodoros, faça uma pausa longa de {customMins.longBreak} minutos
        </p>
      </div>
    </motion.div>
  );
}
