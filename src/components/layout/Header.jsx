// src/components/layout/Header.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp }   from '../../context/AppContext';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { changePasswordRequest } from '../../services/authService';
import {
  Menu, Search, LogOut, Shield, Sun, Moon,
  KeyRound, Eye, EyeOff, X, CheckCircle2, Loader2,
} from 'lucide-react';

const TITLES = {
  dashboard: { title: 'Dashboard',       sub: 'Visão geral do seu dia' },
  tasks:     { title: 'Tarefas',          sub: 'Gerencie suas atividades' },
  habits:    { title: 'Hábitos',          sub: 'Construa sua rotina' },
  agenda:    { title: 'Agenda',           sub: 'Seus eventos e compromissos' },
  finance:   { title: 'Financeiro',       sub: 'Controle de receitas e despesas' },
  goals:     { title: 'Metas',            sub: 'Acompanhe seus objetivos' },
  study:     { title: 'Estudos',          sub: 'Acompanhe seu aprendizado' },
  notes:     { title: 'Notas',            sub: 'Anotações rápidas' },
  pomodoro:  { title: 'Pomodoro',         sub: 'Timer de foco' },
  weekly:    { title: 'Revisão Semanal',  sub: 'Reflita e planeje' },
  admin:     { title: 'Painel Admin',     sub: 'Gestão de usuários' },
};

// ── Modal alterar senha ──────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!current || !next || !confirm) { setError('Preencha todos os campos.'); return; }
    if (next.length < 3) { setError('Nova senha deve ter pelo menos 3 caracteres.'); return; }
    if (next !== confirm) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await changePasswordRequest(current, next);
      setSuccess(true);
      setTimeout(onClose, 1600);
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed z-[70] left-1/2 top-1/2"
        style={{ translateX: '-50%', translateY: '-50%', width: '100%', maxWidth: 380, padding: '0 16px' }}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-md)', boxShadow: 'var(--shadow-lg)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}>
                <KeyRound size={15} style={{ color: 'var(--blue)' }} />
              </div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Alterar Senha</h2>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-xl"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-3)' }}
            >
              <X size={15} />
            </motion.button>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <CheckCircle2 size={36} style={{ color: 'var(--green)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Senha alterada com sucesso!</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Senha atual */}
              <div>
                <label className="label block mb-1.5">SENHA ATUAL</label>
                <div className="relative">
                  <input
                    type={showCur ? 'text' : 'password'}
                    placeholder="••••••"
                    value={current}
                    onChange={(e) => { setCurrent(e.target.value); setError(''); }}
                    className="input-base pr-10"
                    autoFocus
                    disabled={loading}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowCur((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-4)' }}
                  >
                    {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Nova senha */}
              <div>
                <label className="label block mb-1.5">NOVA SENHA</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="mínimo 3 caracteres"
                    value={next}
                    onChange={(e) => { setNext(e.target.value); setError(''); }}
                    className="input-base pr-10"
                    disabled={loading}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-4)' }}
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirmar */}
              <div>
                <label className="label block mb-1.5">CONFIRMAR NOVA SENHA</label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              {/* Erro */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs rounded-lg px-3 py-2"
                    style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Botões */}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                  whileTap={loading ? {} : { scale: 0.97 }}
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar'}
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Header principal ─────────────────────────────────────────────────────────

export default function Header({ onOpenCmd }) {
  const { activeTab, setSidebarOpen } = useApp();
  const { currentUser, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { title, sub } = TITLES[activeTab] || TITLES.dashboard;
  const isAdmin = currentUser?.role === 'admin';

  const [pwdOpen, setPwdOpen] = useState(false);

  return (
    <>
      <header
        className="flex items-center justify-between px-5 lg:px-8 py-4 sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--border)' }}
      >
        {/* Left: hamburger + page title */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-3)' }}
          >
            <Menu size={18} />
          </motion.button>

          <div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={title}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="font-bold text-xl lg:text-2xl leading-none"
                style={{ color: 'var(--text)' }}
              >
                {title}
              </motion.h1>
            </AnimatePresence>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-3)' }}>{sub}</p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">

          {/* User badge — clicável para abrir modal de senha */}
          {currentUser && (
            <motion.button
              onClick={() => setPwdOpen(true)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
              style={{
                background: 'var(--blue-bg)',
                border: '1px solid var(--blue-border)',
              }}
              title="Alterar senha"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'var(--blue)', color: 'var(--on-blue)' }}
              >
                {currentUser.avatar}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>
                {currentUser.name}
              </span>
              {isAdmin && <Shield size={11} style={{ color: 'var(--amber)' }} />}
            </motion.button>
          )}

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isDark ? 'sun' : 'moon'}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0,  scale: 1   }}
                exit={{   opacity: 0, rotate:  90, scale: 0.5 }}
                transition={{ duration: 0.18 }}
                className="block"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Search */}
          <motion.button
            onClick={onOpenCmd}
            whileHover={{ scale: 1.02 }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-colors"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-md)', color: 'var(--text-3)' }}
          >
            <Search size={13} />
            <span className="hidden lg:block">Buscar</span>
            <kbd
              className="px-1.5 py-0.5 rounded text-[10px] hidden lg:block"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-4)' }}
            >
              ⌘K
            </kbd>
          </motion.button>

          {/* Alterar senha — mobile (só ícone) */}
          {currentUser && (
            <motion.button
              onClick={() => setPwdOpen(true)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
              className="sm:hidden p-2 rounded-xl transition-colors"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
              title="Alterar senha"
            >
              <KeyRound size={16} />
            </motion.button>
          )}

          {/* Logout */}
          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
            title="Sair"
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </header>

      {/* Modal alterar senha */}
      <AnimatePresence>
        {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
