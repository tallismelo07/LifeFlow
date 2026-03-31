// src/components/ui/CatMascot.jsx
// Gatinha da Yasmin — exclusiva, bonita e animada 🐱💜

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ══════════════════════════════════════════════════════════════
//  SVG DO GATINHO — redesenhado, proporcional e fofo
// ══════════════════════════════════════════════════════════════

function CatSVG({ happy, blinking, direction }) {
  const flip = direction === 'left' ? 1 : -1; // 1=andando p/ esq, -1=p/ dir

  return (
    <svg
      width="80"
      height="64"
      viewBox="0 0 80 64"
      fill="none"
      style={{ transform: `scaleX(${flip})`, display: 'block' }}
    >
      {/* ── Cauda ─────────────────────────────────────── */}
      <motion.path
        d="M 58 42 C 70 36 76 24 72 14 C 70 8 64 10 66 16"
        stroke="#c97ee0"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        animate={{
          d: happy
            ? [
                'M 58 42 C 70 36 76 24 72 14 C 70 8 64 10 66 16',
                'M 58 42 C 66 28 76 18 74 8  C 72 2  66 4  68 10',
                'M 58 42 C 70 36 76 24 72 14 C 70 8 64 10 66 16',
              ]
            : [
                'M 58 42 C 70 36 76 24 72 14 C 70 8 64 10 66 16',
                'M 58 42 C 72 38 78 28 74 18 C 72 12 66 14 68 20',
                'M 58 42 C 70 36 76 24 72 14 C 70 8 64 10 66 16',
              ],
        }}
        transition={{ duration: happy ? 0.55 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Corpo ─────────────────────────────────────── */}
      <ellipse cx="44" cy="42" rx="22" ry="16" fill="#e4a8f5" />
      {/* Barriga clara */}
      <ellipse cx="44" cy="45" rx="12" ry="9" fill="#f5d0ff" opacity="0.7" />

      {/* ── Pescoço / ombro ───────────────────────────── */}
      <ellipse cx="30" cy="36" rx="10" ry="9" fill="#e4a8f5" />

      {/* ── Patas traseiras ───────────────────────────── */}
      <ellipse cx="56" cy="56" rx="7" ry="4" fill="#e4a8f5" />
      <ellipse cx="46" cy="57" rx="7" ry="4" fill="#dda0ee" />
      {/* Dedos */}
      <line x1="50" y1="59" x2="50" y2="61" stroke="#c97ee0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="54" y1="59" x2="54" y2="61" stroke="#c97ee0" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Cabeça ────────────────────────────────────── */}
      <circle cx="22" cy="27" r="18" fill="#eebbff" />
      {/* Bocochecha rosada */}
      <ellipse cx="12" cy="32" rx="4" ry="2.5" fill="#ffb3d9" opacity="0.55" />
      <ellipse cx="32" cy="32" rx="4" ry="2.5" fill="#ffb3d9" opacity="0.55" />

      {/* ── Orelhas ───────────────────────────────────── */}
      {/* Esquerda */}
      <polygon points="8,18 6,4 16,14"  fill="#eebbff" />
      <polygon points="9,17 8,7  15,13" fill="#f9c0e8" opacity="0.8" />
      {/* Direita */}
      <polygon points="26,14 36,4 38,18" fill="#eebbff" />
      <polygon points="27,13 35,7 36,16" fill="#f9c0e8" opacity="0.8" />

      {/* ── Olhos ─────────────────────────────────────── */}
      {happy || blinking ? (
        <>
          {/* Olhos fechados / felizes */}
          <path d="M 13 26 Q 16.5 22 20 26" stroke="#7c2fa8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M 24 26 Q 27.5 22 31 26" stroke="#7c2fa8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* Olho esquerdo */}
          <ellipse cx="17" cy="26" rx="4.5" ry="5" fill="#3d1060" />
          <ellipse cx="17" cy="25" rx="2.2" ry="2.8" fill="#220840" />
          <circle  cx="15.5" cy="23.5" r="1.3" fill="white" opacity="0.9" />
          <circle  cx="19" cy="27" r="0.7" fill="white" opacity="0.5" />
          {/* Olho direito */}
          <ellipse cx="27" cy="26" rx="4.5" ry="5" fill="#3d1060" />
          <ellipse cx="27" cy="25" rx="2.2" ry="2.8" fill="#220840" />
          <circle  cx="25.5" cy="23.5" r="1.3" fill="white" opacity="0.9" />
          <circle  cx="29" cy="27" r="0.7" fill="white" opacity="0.5" />
        </>
      )}

      {/* ── Nariz ─────────────────────────────────────── */}
      <polygon points="20,30 22,30 21,32" fill="#ff7eb3" />

      {/* ── Boca ──────────────────────────────────────── */}
      <path
        d={happy ? 'M 17 33 Q 21 38 25 33' : 'M 17 33 Q 21 35.5 25 33'}
        stroke="#cc5c8a"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Bigodes ───────────────────────────────────── */}
      <line x1="2"  y1="28" x2="14" y2="29.5" stroke="#d9a0f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <line x1="2"  y1="31" x2="14" y2="31"   stroke="#d9a0f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <line x1="3"  y1="34" x2="14" y2="32"   stroke="#d9a0f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"  />
      <line x1="28" y1="29.5" x2="40" y2="28" stroke="#d9a0f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <line x1="28" y1="31"   x2="40" y2="31" stroke="#d9a0f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <line x1="28" y1="32"   x2="40" y2="34" stroke="#d9a0f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"  />

      {/* ── Patas da frente ───────────────────────────── */}
      <ellipse cx="34" cy="56" rx="7.5" ry="4" fill="#e4a8f5" />
      <ellipse cx="44" cy="57" rx="7.5" ry="4" fill="#dda0ee" />
      {/* Dedos */}
      <line x1="38" y1="59" x2="38" y2="61" stroke="#c97ee0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="42" y1="59" x2="42" y2="61" stroke="#c97ee0" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Coleira ───────────────────────────────────── */}
      <path d="M 8 36 Q 22 44 36 36" stroke="#ff4fa0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Sininho */}
      <circle cx="22" cy="41" r="3.5" fill="#ffd700" />
      <line x1="22" y1="43.5" x2="22" y2="45" stroke="#c9a800" strokeWidth="1.2" strokeLinecap="round" />

      {/* ── Padrão de manchas no corpo ────────────────── */}
      <ellipse cx="38" cy="36" rx="5" ry="3.5" fill="#d490e8" opacity="0.5" />
      <ellipse cx="50" cy="38" rx="4" ry="3"   fill="#d490e8" opacity="0.4" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
//  BALÃO DE FALA
// ══════════════════════════════════════════════════════════════

const MEOWS = [
  'Miau! 🐾', 'Ronron~ 💜', '=^.^= oi!',
  'Prrrrr 🌙', 'Fofura máx 🌸', 'Miau miau! ✨', '🐟 peixe??',
];

function Bubble({ text }) {
  return (
    <motion.div
      style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', pointerEvents: 'none' }}
      initial={{ opacity: 0, scale: 0.5, y: 8 }}
      animate={{ opacity: 1, scale: 1,   y: 0  }}
      exit={{    opacity: 0, scale: 0.7,  y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <div style={{
        background: '#fff', color: '#7c2fa8',
        border: '2px solid #e4a8f5',
        padding: '5px 12px', borderRadius: 20,
        fontSize: 13, fontWeight: 700,
        boxShadow: '0 4px 16px rgba(124,47,168,0.20)',
      }}>
        {text}
      </div>
      {/* Seta do balão */}
      <div style={{
        position: 'absolute', bottom: -7, left: '50%', marginLeft: -7,
        width: 0, height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: '7px solid #fff',
      }} />
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CAT MASCOT — principal
// ══════════════════════════════════════════════════════════════

export default function CatMascot() {
  const [happy,    setHappy]    = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [message,  setMessage]  = useState('');
  const [showMsg,  setShowMsg]  = useState(false);
  const timerRef = useRef(null);

  // Piscar aleatório (2–5s)
  useEffect(() => {
    let t;
    const schedule = () => {
      t = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 140);
        schedule();
      }, 2000 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    if (happy) return;
    const msg = MEOWS[Math.floor(Math.random() * MEOWS.length)];
    setMessage(msg);
    setShowMsg(true);
    setHappy(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowMsg(false);
      setHappy(false);
    }, 2400);
  };

  // Tamanho seguro para mobile — fica acima do BottomNav (58px)
  const bottomOffset = 'calc(env(safe-area-inset-bottom, 0px) + 70px)';

  return (
    <motion.div
      style={{
        position: 'fixed',
        bottom:   bottomOffset,
        zIndex:   50,
        cursor:   'pointer',
        // Anima da direita para esquerda e volta (mirror)
      }}
      animate={{ x: ['calc(100vw + 90px)', 'calc(-90px)'] }}
      transition={{ duration: 26, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
      onClick={handleClick}
      title="Clique! 🐾"
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Balão */}
        <AnimatePresence>
          {showMsg && <Bubble text={message} />}
        </AnimatePresence>

        {/* Gatinho com bobinho walk + pulo ao clicar */}
        <motion.div
          animate={happy
            ? { y: [0, -22, -4, 0], rotate: [0, 10, -8, 0] }
            : { y: [0, -3, 0] }
          }
          transition={happy
            ? { duration: 0.5, ease: 'easeOut' }
            : { duration: 0.38, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <CatSVG happy={happy} blinking={blinking} direction="left" />
        </motion.div>
      </div>
    </motion.div>
  );
}
