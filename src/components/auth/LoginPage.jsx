// src/components/auth/LoginPage.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Zap, Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Preencha o usuário e a senha.'); return; }
    setLoading(true); setError('');
    const result = await login(username.trim(), password.trim());
    if (!result.ok) setError(result.message);
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Subtle background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(ellipse, var(--blue) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(ellipse, var(--violet) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm z-10">
        {/* Logo area */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--blue)', boxShadow: '0 8px 24px var(--blue-bg)' }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Zap size={28} color="#fff" fill="#fff" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            LifeFlow
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Organização pessoal inteligente
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-soft)',
            border: '1px solid var(--border-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text)' }}>
            Entrar na sua conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="label block mb-1.5">USUÁRIO</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-4)' }} />
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

            {/* Password */}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }}>
              <label className="label block mb-1.5">SENHA</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-4)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="input-base pl-10 pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-4)' }}
                  tabIndex={-1}
                >
                  <AnimatePresence mode="wait">
                    <motion.span key={showPass ? 'hide' : 'show'}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.1 }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                  className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3"
                  style={{
                    background: 'var(--red-bg)',
                    border: '1px solid var(--red-border)',
                    color: 'var(--red)',
                  }}
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                whileHover={loading ? {} : { scale: 1.01 }}
                whileTap={loading ? {} : { scale: 0.98 }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                  : 'Entrar na conta'
                }
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p
          className="text-center text-xs font-mono mt-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ color: 'var(--text-4)' }}
        >
          LifeFlow v3 · Autenticação segura
        </motion.p>
      </div>
    </div>
  );
}
