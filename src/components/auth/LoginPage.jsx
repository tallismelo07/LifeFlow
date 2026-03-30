// src/components/auth/LoginPage.jsx
// Login limpo — logo centralizada, frase motivacional, fade suave

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, Leaf } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

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
      className="min-h-screen flex flex-col items-center justify-center px-4 pb-8"
      style={{ background: 'var(--bg)' }}
    >
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo + título */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border-md)',
              boxShadow: 'var(--shadow-md)',
            }}
            initial={{ scale: 0.7, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            whileHover={{ scale: 1.06, rotate: 4 }}
          >
            <Leaf size={26} style={{ color: 'var(--text)' }} strokeWidth={1.7} />
          </motion.div>

          <motion.h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            LifeFlow
          </motion.h1>

          <motion.p
            className="text-sm mt-1.5 text-center"
            style={{ color: 'var(--text-4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Melhore sua vida com o LifeFlow
          </motion.p>
        </div>

        {/* Card do formulário */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border-md)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Usuário */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="label block mb-1.5">USUÁRIO</label>
                <div className="relative">
                  <User
                    size={15}
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
                transition={{ delay: 0.36 }}
              >
                <label className="label block mb-1.5">SENHA</label>
                <div className="relative">
                  <Lock
                    size={15}
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
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3"
                      style={{
                        background: 'var(--red-bg)',
                        border: '1px solid var(--red-border)',
                        color: 'var(--red)',
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
                transition={{ delay: 0.42 }}
              >
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
          </div>
        </motion.div>

        <motion.p
          className="text-center text-[11px] font-mono mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{ color: 'var(--text-4)' }}
        >
          LifeFlow · Autenticação segura
        </motion.p>
      </motion.div>
    </div>
  );
}
