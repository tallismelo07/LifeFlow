// src/components/auth/LoginPage.jsx
// Login com abajur interativo — puxa a corda para acender a luz
// Tema adaptável: dark (ambiente escuro) / light (ambiente claro)

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, Leaf } from 'lucide-react';

// ── Abajur SVG ───────────────────────────────────────────────────────────────

function Abajur({ lit, isDark }) {
  // Cores da cúpula adaptam ao tema
  const shadeOff  = isDark ? '#2b3035' : '#ced4da';
  const shadeOn   = isDark ? '#92400e' : '#92400e';
  const rimColor  = lit ? '#f59e0b' : (isDark ? '#495057' : '#adb5bd');
  const wireColor = isDark ? '#6b7280' : '#9ca3af';
  const bulbOff   = isDark ? '#1a1d20' : '#dee2e6';

  return (
    <svg width="140" height="130" viewBox="0 0 140 130" fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="innerGlow" cx="50%" cy="85%" r="60%">
          <stop offset="0%"   stopColor="#fef9c3" stopOpacity={lit ? 0.9 : 0} />
          <stop offset="50%"  stopColor="#fde68a" stopOpacity={lit ? 0.5 : 0} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Suporte no teto */}
      <motion.rect
        x="57" y="0" width="26" height="14" rx="5"
        animate={{ fill: lit ? '#92400e' : shadeOff }}
        transition={{ duration: 0.5 }}
      />

      {/* Fio teto→cúpula */}
      <line x1="70" y1="14" x2="70" y2="38"
        stroke={wireColor} strokeWidth="2" strokeLinecap="round" />

      {/* Anel superior da cúpula */}
      <motion.ellipse
        cx="70" cy="38" rx="18" ry="5"
        animate={{ fill: lit ? '#a16207' : shadeOff, stroke: lit ? '#d97706' : rimColor }}
        transition={{ duration: 0.5 }}
        strokeWidth="1"
      />

      {/* Cúpula preenchida */}
      <motion.path
        d="M 52 38 L 88 38 L 110 98 L 30 98 Z"
        animate={{ fill: lit ? shadeOn : shadeOff }}
        transition={{ duration: 0.5 }}
        opacity="0.95"
      />
      {/* Brilho interior */}
      <motion.path
        d="M 55 42 L 85 42 L 105 92 L 35 92 Z"
        animate={{ fill: 'url(#innerGlow)', opacity: lit ? 0.8 : 0 }}
        transition={{ duration: 0.5 }}
      />
      {/* Contorno da cúpula */}
      <motion.path
        d="M 52 38 L 88 38 L 110 98 L 30 98 Z"
        fill="none"
        animate={{ stroke: lit ? '#b45309' : rimColor }}
        transition={{ duration: 0.5 }}
        strokeWidth="1.5"
      />

      {/* Rim inferior */}
      <motion.line
        x1="30" y1="98" x2="110" y2="98"
        animate={{ stroke: rimColor }}
        transition={{ duration: 0.5 }}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Lâmpada */}
      <motion.circle
        cx="70" cy="88" r="12"
        animate={{
          fill:    lit ? '#fef9c3' : bulbOff,
          opacity: lit ? 1 : 0.5,
        }}
        transition={{ duration: 0.4 }}
        style={lit ? { filter: 'url(#softGlow)' } : {}}
      />
      <motion.circle
        cx="66" cy="84" r="5"
        animate={{ fill: lit ? 'white' : 'transparent', opacity: lit ? 0.6 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Glow externo */}
      <motion.ellipse
        cx="70" cy="98" rx="60" ry="22"
        animate={{ fill: lit ? '#fde68a' : 'transparent', opacity: lit ? 0.18 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ filter: 'blur(12px)' }}
      />
    </svg>
  );
}

// ── Abajur + corda ───────────────────────────────────────────────────────────

function LampAssembly({ lit, onToggle, isDark }) {
  const controls  = useAnimation();
  const [pulling, setPulling] = useState(false);

  const handleCordClick = useCallback(async () => {
    if (pulling) return;
    setPulling(true);
    await controls.start({ y: 28, transition: { duration: 0.18, ease: 'easeOut' } });
    await controls.start({ y: 0,  transition: { type: 'spring', stiffness: 260, damping: 14 } });
    onToggle();
    setPulling(false);
  }, [controls, onToggle, pulling]);

  const wireColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <div className="flex flex-col items-center select-none">
      <Abajur lit={lit} isDark={isDark} />

      <motion.div
        animate={controls}
        onClick={handleCordClick}
        className="flex flex-col items-center cursor-pointer"
        style={{ marginTop: -6 }}
      >
        {/* Fio */}
        <div style={{ width: 2, height: 68, background: `linear-gradient(to bottom, ${wireColor}, #9ca3af)`, borderRadius: 2 }} />

        {/* Borla */}
        <motion.div
          className="flex flex-col items-center gap-0.5"
          animate={{ scale: pulling ? 0.9 : [1, 1.08, 1] }}
          transition={pulling
            ? { duration: 0.1 }
            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <motion.div
            className="rounded-full"
            style={{ width: 18, height: 18 }}
            animate={{
              background: lit ? '#f59e0b' : (isDark ? '#4b5563' : '#adb5bd'),
              boxShadow:  lit ? '0 0 10px rgba(245,158,11,0.6)' : 'none',
            }}
            transition={{ duration: 0.4 }}
          />
          <div style={{ width: 2, height: 10, background: wireColor, borderRadius: 2 }} />
          <div style={{ width: 12, height: 3, background: wireColor, borderRadius: 2 }} />
        </motion.div>
      </motion.div>

      <motion.p
        className="text-xs font-mono mt-4 text-center"
        animate={{ opacity: lit ? 0.35 : 0.6 }}
        style={{ color: 'var(--text-4)', letterSpacing: '0.05em' }}
      >
        {lit ? 'clique para apagar' : 'puxe a corda ↑'}
      </motion.p>
    </div>
  );
}

// ── Página de login ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login }      = useAuth();
  const { isDark }     = useTheme();

  const [lit,      setLit]      = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

  const toggleLamp = useCallback(() => setLit((v) => !v), []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Preencha o usuário e a senha.');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username.trim(), password.trim());
    if (!result.ok) {
      setError(result.message || 'Credenciais inválidas.');
      triggerShake();
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Glow de fundo quando acesa */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: lit
            ? 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(251,191,36,0.11) 0%, rgba(217,119,6,0.05) 45%, transparent 75%)'
            : 'transparent',
        }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />

      {/* Partículas de luz flutuantes */}
      <AnimatePresence>
        {lit && [0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width:  [4, 3, 5, 3][i],
              height: [4, 3, 5, 3][i],
              background: '#fde68a',
              left: `${[35, 52, 65, 44][i]}%`,
              top:  `${[28, 22, 30, 35][i]}%`,
              opacity: 0,
            }}
            animate={{ y: [0, -30, -60], opacity: [0, 0.5, 0], scale: [1, 1.2, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 + i * 0.4, delay: i * 0.7, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Abajur */}
      <div className="mt-10 md:mt-14 z-10">
        <LampAssembly lit={lit} onToggle={toggleLamp} isDark={isDark} />
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-start justify-center w-full px-4 mt-2 pb-8 z-10">
        <AnimatePresence mode="wait">
          {lit ? (
            <motion.div
              key="form"
              className="w-full max-w-sm"
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 32, scale: 0.97  }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Logo */}
              <div className="flex flex-col items-center mb-6">
                <motion.div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--blue)' }}
                  initial={{ scale: 0.6, rotate: -20 }}
                  animate={{ scale: 1,   rotate: 0   }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                  whileHover={{ scale: 1.08, rotate: 6 }}
                >
                  <Leaf size={22} style={{ color: 'var(--on-blue)' }} strokeWidth={1.8} />
                </motion.div>
                <motion.h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--text)' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  LifeFlow
                </motion.h1>
                <motion.p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--text-3)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Melhore sua vida com o LifeFlow
                </motion.p>
              </div>

              {/* Card */}
              <motion.div
                animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="rounded-2xl p-7"
                  style={{
                    background:     'var(--bg-soft)',
                    border:         '1px solid var(--border-md)',
                    boxShadow:      'var(--shadow-lg)',
                  }}
                >
                  <motion.h2
                    className="text-base font-bold mb-5"
                    style={{ color: 'var(--text)' }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22 }}
                  >
                    Entrar na conta
                  </motion.h2>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Usuário */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.26 }}
                    >
                      <label className="label block mb-1.5">USUÁRIO</label>
                      <div className="relative">
                        <User size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'var(--text-4)' }}
                        />
                        <input
                          type="text"
                          placeholder="seu usuário"
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); setError(''); }}
                          className="input-base pl-10"
                          autoComplete="username"
                          autoFocus
                          disabled={loading}
                        />
                      </div>
                    </motion.div>

                    {/* Senha */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.32 }}
                    >
                      <label className="label block mb-1.5">SENHA</label>
                      <div className="relative">
                        <Lock size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'var(--text-4)' }}
                        />
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(''); }}
                          className="input-base pl-10 pr-11"
                          autoComplete="current-password"
                          disabled={loading}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--text-4)' }}
                          tabIndex={-1}
                        >
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={showPass ? 'hide' : 'show'}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1   }}
                              exit={{    opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.12 }}
                            >
                              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </motion.span>
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Erro */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -6 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{    opacity: 0, height: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3"
                            style={{
                              background: 'var(--red-bg)',
                              border:     '1px solid var(--red-border)',
                              color:      'var(--red)',
                            }}
                          >
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Botão */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.38 }}
                    >
                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                        whileHover={loading ? {} : { scale: 1.01 }}
                        whileTap={loading   ? {} : { scale: 0.98 }}
                      >
                        {loading
                          ? <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                          : 'Entrar na conta'
                        }
                      </motion.button>
                    </motion.div>
                  </form>
                </div>
              </motion.div>

              <motion.p
                className="text-center text-[11px] font-mono mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: 'var(--text-4)' }}
              >
                LifeFlow v5 · Autenticação segura
              </motion.p>
            </motion.div>
          ) : (
            /* Tela escura inicial — apenas hint */
            <motion.div
              key="dark"
              className="flex flex-col items-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="text-sm font-mono"
                style={{ color: 'var(--text-4)' }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                LifeFlow
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
