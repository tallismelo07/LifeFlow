// src/components/auth/WelcomeScreen.jsx
// Tela de boas-vindas — exibida após o login, não ao recarregar

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, ArrowRight } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Hook de digitação — digita uma string letra por letra
function useTyping(text, { startDelay = 500, speed = 55 } = {}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, startDelay, speed]);

  return { displayed, done };
}

export default function WelcomeScreen({ user, onDone }) {
  const greeting  = getGreeting();
  const firstName = user?.name?.split(' ')[0] || user?.name || 'você';
  const fullText  = `${greeting}, ${firstName}`;

  const { displayed, done } = useTyping(fullText, { startDelay: 600, speed: 55 });
  const [fadeOut, setFadeOut] = useState(false);

  // Auto-fade 4s após terminar de digitar (dá tempo para ler)
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setFadeOut(true), 4000);
    return () => clearTimeout(t);
  }, [done]);

  const handleEnter = () => setFadeOut(true);

  const handleAnimationComplete = () => {
    if (fadeOut) onDone();
  };

  return (
    <AnimatePresence>
      {!fadeOut ? (
        <motion.div
          key="welcome"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'var(--bg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          onAnimationComplete={handleAnimationComplete}
        >
          {/* Logo animada */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="mb-8"
          >
            <motion.div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--border-md)',
                boxShadow: '0 0 0 1px var(--border), 0 24px 64px rgba(0,0,0,0.6)',
              }}
              animate={{ boxShadow: [
                '0 0 0 1px var(--border), 0 24px 64px rgba(0,0,0,0.6)',
                '0 0 0 1px var(--border-md), 0 24px 80px rgba(0,0,0,0.8)',
                '0 0 0 1px var(--border), 0 24px 64px rgba(0,0,0,0.6)',
              ]}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Leaf size={42} style={{ color: 'var(--text)' }} strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          {/* Nome da app */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm font-semibold uppercase mb-8"
            style={{ color: 'var(--text-4)', letterSpacing: '0.24em' }}
          >
            LifeFlow
          </motion.p>

          {/* Saudação com efeito de digitação */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            className="text-center px-8"
          >
            <h1
              className="font-bold tracking-tight"
              style={{
                color: 'var(--text)',
                fontSize: 'clamp(2rem, 7vw, 3.5rem)',
                lineHeight: 1.1,
                minHeight: '1.2em',
              }}
            >
              {displayed}
              {!done && <span className="typing-cursor" />}
            </h1>
          </motion.div>

          {/* Subtítulo + botão — aparecem após terminar de digitar */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center gap-6 mt-6"
              >
                <p className="text-base" style={{ color: 'var(--text-3)' }}>
                  Pronto para um dia produtivo?
                </p>

                {/* Botão "Entrar agora" */}
                <motion.button
                  onClick={handleEnter}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-2xl transition-all"
                  style={{
                    background: 'var(--text)',
                    color: 'var(--bg)',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.10)',
                  }}
                >
                  Entrar agora
                  <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          className="fixed inset-0 z-[100]"
          style={{ background: 'var(--bg)', pointerEvents: 'none' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </AnimatePresence>
  );
}
