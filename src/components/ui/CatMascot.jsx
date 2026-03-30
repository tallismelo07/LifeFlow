// src/components/ui/CatMascot.jsx
// Gatinho animado exclusivo da Yasmin 🐱

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── SVG do gatinho (voltado para a direita) ──────────────────────────────────

function CatSVG({ happy, blinking }) {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
      {/* Cauda */}
      <motion.path
        d="M 60 36 Q 72 26 70 16 Q 68 8 64 12"
        stroke="#d4a0e0"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        animate={{ d: happy
          ? ['M 60 36 Q 72 26 70 16 Q 68 8 64 12', 'M 60 36 Q 68 20 72 12 Q 70 4 66 8', 'M 60 36 Q 72 26 70 16 Q 68 8 64 12']
          : ['M 60 36 Q 72 26 70 16 Q 68 8 64 12', 'M 60 36 Q 74 30 72 18 Q 70 10 66 14', 'M 60 36 Q 72 26 70 16 Q 68 8 64 12'],
        }}
        transition={{ duration: happy ? 0.5 : 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Corpo */}
      <ellipse cx="44" cy="38" rx="20" ry="14" fill="#e9b8f4" />
      <ellipse cx="44" cy="38" rx="18" ry="12" fill="#f0c8ff" opacity="0.5" />

      {/* Barriga */}
      <ellipse cx="44" cy="40" rx="10" ry="7" fill="#fde2ff" opacity="0.8" />

      {/* Patinhas traseiras */}
      <ellipse cx="56" cy="50" rx="5" ry="3.5" fill="#e9b8f4" />
      <ellipse cx="48" cy="51" rx="5" ry="3.5" fill="#e9b8f4" />

      {/* Pescoço */}
      <ellipse cx="28" cy="34" rx="9" ry="8" fill="#e9b8f4" />

      {/* Cabeça */}
      <circle cx="20" cy="26" r="16" fill="#e9b8f4" />
      <circle cx="20" cy="26" r="14" fill="#f0c8ff" opacity="0.4" />

      {/* Orelha esquerda */}
      <polygon points="8,16 10,4 18,14" fill="#e9b8f4" />
      <polygon points="10,14 11,7 17,13" fill="#ffb3d4" opacity="0.7" />

      {/* Orelha direita */}
      <polygon points="22,14 30,4 32,16" fill="#e9b8f4" />
      <polygon points="23,13 29,7 31,14" fill="#ffb3d4" opacity="0.7" />

      {/* Olho esquerdo */}
      {happy || blinking ? (
        <path d="M 13 24 Q 16 21 19 24" stroke="#7e3f8f" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <ellipse cx="16" cy="25" rx="3.5" ry="4" fill="#7e3f8f" />
          <ellipse cx="16" cy="24" rx="1.5" ry="2" fill="#4a1a5e" />
          <circle cx="15" cy="23.5" r="1" fill="white" opacity="0.8" />
        </>
      )}

      {/* Olho direito */}
      {happy || blinking ? (
        <path d="M 21 24 Q 24 21 27 24" stroke="#7e3f8f" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <ellipse cx="24" cy="25" rx="3.5" ry="4" fill="#7e3f8f" />
          <ellipse cx="24" cy="24" rx="1.5" ry="2" fill="#4a1a5e" />
          <circle cx="23" cy="23.5" r="1" fill="white" opacity="0.8" />
        </>
      )}

      {/* Narizinho */}
      <polygon points="19,29 21,29 20,31" fill="#ff9eba" />

      {/* Boca */}
      <path
        d={happy ? 'M 17 32 Q 20 36 23 32' : 'M 17 32 Q 20 34 23 32'}
        stroke="#c97dab"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bigodes esquerda */}
      <line x1="2"  y1="27" x2="13" y2="28" stroke="#c197d4" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="2"  y1="30" x2="13" y2="30" stroke="#c197d4" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="3"  y1="33" x2="13" y2="31" stroke="#c197d4" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

      {/* Bigodes direita */}
      <line x1="27" y1="28" x2="38" y2="27" stroke="#c197d4" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="27" y1="30" x2="38" y2="30" stroke="#c197d4" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <line x1="27" y1="31" x2="38" y2="33" stroke="#c197d4" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

      {/* Patinhas da frente */}
      <ellipse cx="30" cy="50" rx="5.5" ry="3.5" fill="#e9b8f4" />
      <ellipse cx="40" cy="51" rx="5.5" ry="3.5" fill="#e9b8f4" />

      {/* Coleira */}
      <path d="M 12 34 Q 20 40 28 34" stroke="#ff6b9d" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="37" r="2.5" fill="#ffcc00" />
    </svg>
  );
}

// ── Balão de fala ────────────────────────────────────────────────────────────

const MEOW_MESSAGES = ['Miau! 🐾', 'Ronron~ 💜', '=^.^= oi!', 'Prrrrr... 🌙', '🐾 Miau!'];

function SpeechBubble({ text }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1,   y: 0  }}
      exit={{    opacity: 0, scale: 0.7,  y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
    >
      <div
        className="px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-lg"
        style={{
          background: '#fff',
          color: '#7e3f8f',
          border: '2px solid #e9b8f4',
        }}
      >
        {text}
      </div>
      {/* Rabinho do balão */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          marginLeft: -6,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #fff',
        }}
      />
    </motion.div>
  );
}

// ── CatMascot principal ──────────────────────────────────────────────────────

export default function CatMascot() {
  const [happy,    setHappy]    = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [message,  setMessage]  = useState('');
  const [showMsg,  setShowMsg]  = useState(false);
  const msgTimerRef = useRef(null);

  // Piscar olhos aleatoriamente
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const schedule = () => {
      const delay = 2000 + Math.random() * 4000;
      return setTimeout(() => { blink(); schedule(); }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    if (happy) return;
    // Escolhe mensagem aleatória
    const msg = MEOW_MESSAGES[Math.floor(Math.random() * MEOW_MESSAGES.length)];
    setMessage(msg);
    setShowMsg(true);
    setHappy(true);
    clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => {
      setShowMsg(false);
      setHappy(false);
    }, 2200);
  };

  return (
    <motion.div
      className="fixed z-[99] cursor-pointer"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 68px)',
      }}
      // Caminha da direita para a esquerda, depois volta (mirror)
      animate={{ x: ['calc(100vw + 80px)', 'calc(-80px)'] }}
      transition={{
        duration:    22,
        repeat:      Infinity,
        repeatType:  'mirror',
        ease:        'linear',
      }}
      onClick={handleClick}
      title="Clique no gatinho! 🐾"
    >
      <div className="relative">
        {/* Balão de fala */}
        <AnimatePresence>
          {showMsg && <SpeechBubble text={message} />}
        </AnimatePresence>

        {/* Gatinho com animação de andar */}
        <motion.div
          animate={happy
            ? { y: [0, -18, 0], rotate: [0, 8, -8, 0] }
            : { y: [0, -3,  0] }
          }
          transition={happy
            ? { duration: 0.45, ease: 'easeOut' }
            : { duration: 0.35, repeat: Infinity, ease: 'easeInOut' }
          }
          // Espelha quando vai da direita para esquerda
          style={{ display: 'inline-block' }}
        >
          <CatSVG happy={happy} blinking={blinking} />
        </motion.div>
      </div>
    </motion.div>
  );
}
