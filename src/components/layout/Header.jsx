// src/components/layout/Header.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNav }   from '../../context/NavContext';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { changePasswordRequest } from '../../services/authService';
import {
  Menu, Search, LogOut, Shield, Sun, Moon,
  KeyRound, Eye, EyeOff, X, CheckCircle2, Loader2, User, Save,
  CloudOff,
} from 'lucide-react';


const TITLES = {
  home:      { title: 'Início',      sub: 'Bem-vindo de volta'              },
  checkin:   { title: 'Check-in',    sub: 'Como foi seu dia?'               },
  dashboard: { title: 'Dashboard',   sub: 'Visão geral do seu dia'          },
  tasks:     { title: 'Tarefas',     sub: 'Organize sua lista de afazeres'  },
  habits:    { title: 'Hábitos',     sub: 'Construa sua rotina'             },
  agenda:    { title: 'Agenda',      sub: 'Seus eventos e compromissos'     },
  finance:   { title: 'Financeiro',  sub: 'Controle de receitas e despesas' },
  goals:     { title: 'Metas',       sub: 'Acompanhe seus objetivos'        },
  admin:     { title: 'Painel Admin',sub: 'Gestão de usuários'              },
  feedback:  { title: 'Sugestões',   sub: 'Envie ideias e feedback'         },
};

// ── Save status pill — escuta eventos customizados do AppContext ──────────────
function SaveIndicator() {
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  useEffect(() => {
    let timer;
    const onSaving = () => { clearTimeout(timer); setStatus('saving'); };
    const onSaved  = () => {
      clearTimeout(timer);
      setStatus('saved');
      timer = setTimeout(() => setStatus(null), 2200);
    };
    const onError  = () => {
      clearTimeout(timer);
      setStatus('error');
      timer = setTimeout(() => setStatus(null), 3500);
    };

    window.addEventListener('lf:save:start', onSaving);
    window.addEventListener('lf:save:done',  onSaved);
    window.addEventListener('lf:save:error', onError);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('lf:save:start', onSaving);
      window.removeEventListener('lf:save:done',  onSaved);
      window.removeEventListener('lf:save:error', onError);
    };
  }, []);

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.85, y: -4 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.85, y: -4  }}
          transition={{ duration: 0.18 }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium"
          style={{
            background: status === 'error'  ? 'var(--red-bg)'
                      : status === 'saved'  ? 'var(--green-bg)'
                      :                       'var(--blue-bg)',
            border: `1px solid ${
                      status === 'error'  ? 'var(--red-border)'
                      : status === 'saved'  ? 'var(--green-border)'
                      :                       'var(--blue-border)'}`,
            color:  status === 'error'  ? 'var(--red)'
                  : status === 'saved'  ? 'var(--green)'
                  :                       'var(--text-3)',
          }}
        >
          {status === 'saving' && <Loader2 size={11} className="animate-spin" />}
          {status === 'saved'  && <CheckCircle2 size={11} />}
          {status === 'error'  && <CloudOff size={11} />}
          {status === 'saving' ? 'Salvando…' : status === 'saved' ? 'Salvo' : 'Erro ao salvar'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Modal Minha Conta (perfil + alterar senha) ───────────────────────────────

function AccountModal({ onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [tab, setTab] = useState('profile'); // 'profile' | 'password'

  // Perfil
  const [name,       setName]       = useState(currentUser?.name || '');
  const [savingProf, setSavingProf] = useState(false);
  const [profErr,    setProfErr]    = useState('');
  const [profOk,     setProfOk]     = useState(false);

  // Senha
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErr,   setPwdErr]   = useState('');
  const [pwdOk,    setPwdOk]    = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfErr('');
    if (!name.trim() || name.trim().length < 2) {
      setProfErr('Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    setSavingProf(true);
    try {
      await updateProfile(name.trim(), '');
      setProfOk(true);
      setTimeout(() => setProfOk(false), 2000);
    } catch (err) {
      setProfErr(err?.response?.data?.error || 'Erro ao salvar perfil.');
    } finally {
      setSavingProf(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdErr('');
    if (!current || !next || !confirm) { setPwdErr('Preencha todos os campos.'); return; }
    if (next.length < 3) { setPwdErr('Nova senha deve ter pelo menos 3 caracteres.'); return; }
    if (next !== confirm) { setPwdErr('As senhas não coincidem.'); return; }
    setSavingPwd(true);
    try {
      await changePasswordRequest(current, next);
      setPwdOk(true);
      setTimeout(onClose, 1600);
    } catch (err) {
      setPwdErr(err?.response?.data?.error || 'Erro ao alterar senha.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed z-[70] left-1/2 top-1/2"
        style={{ translateX: '-50%', translateY: '-50%', width: '100%', maxWidth: 400, padding: '0 16px' }}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-md)', boxShadow: 'var(--shadow-lg)' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Minha Conta</h2>
            <motion.button onClick={onClose}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-xl"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-3)' }}>
              <X size={15} />
            </motion.button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
            {[
              { id: 'profile',  label: 'Perfil',  Icon: User },
              { id: 'password', label: 'Senha',   Icon: KeyRound },
            ].map(({ id, label, Icon }) => (
              <button key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={tab === id
                  ? { background: 'var(--blue)', color: 'var(--on-blue)' }
                  : { color: 'var(--text-3)' }}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Aba: Perfil */}
          {tab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <div>
                <label className="label block mb-1.5">SEU NOME</label>
                <input
                  type="text"
                  placeholder="Como você quer ser chamado?"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setProfErr(''); }}
                  className="input-base"
                  disabled={savingProf}
                  maxLength={64}
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {profErr && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs rounded-lg px-3 py-2"
                    style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                    {profErr}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={savingProf}>
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={savingProf}
                  whileTap={savingProf ? {} : { scale: 0.97 }}
                >
                  {savingProf ? (
                    <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                  ) : profOk ? (
                    <><CheckCircle2 size={14} /> Salvo!</>
                  ) : (
                    <><Save size={14} /> Salvar</>
                  )}
                </motion.button>
              </div>
            </form>
          )}

          {/* Aba: Senha */}
          {tab === 'password' && (
            <>
              {pwdOk ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 size={36} style={{ color: 'var(--green)' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Senha alterada com sucesso!</p>
                </motion.div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="label block mb-1.5">SENHA ATUAL</label>
                    <div className="relative">
                      <input
                        type={showCur ? 'text' : 'password'}
                        placeholder="••••••"
                        value={current}
                        onChange={(e) => { setCurrent(e.target.value); setPwdErr(''); }}
                        className="input-base pr-10"
                        autoFocus
                        disabled={savingPwd}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowCur((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-4)' }}>
                        {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label block mb-1.5">NOVA SENHA</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        placeholder="mínimo 3 caracteres"
                        value={next}
                        onChange={(e) => { setNext(e.target.value); setPwdErr(''); }}
                        className="input-base pr-10"
                        disabled={savingPwd}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-4)' }}>
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label block mb-1.5">CONFIRMAR NOVA SENHA</label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setPwdErr(''); }}
                      className="input-base"
                      disabled={savingPwd}
                    />
                  </div>

                  <AnimatePresence>
                    {pwdErr && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-xs rounded-lg px-3 py-2"
                        style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                        {pwdErr}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={savingPwd}>
                      Cancelar
                    </button>
                    <motion.button
                      type="submit"
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                      disabled={savingPwd}
                      whileTap={savingPwd ? {} : { scale: 0.97 }}
                    >
                      {savingPwd ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar'}
                    </motion.button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Header principal ─────────────────────────────────────────────────────────

export default function Header({ onOpenCmd }) {
  const { activeTab, setSidebarOpen } = useNav();
  const { currentUser, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { title, sub } = TITLES[activeTab] || TITLES.dashboard;
  const isAdmin = currentUser?.role === 'admin';

  const [accountOpen, setAccountOpen] = useState(false);

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
          <SaveIndicator />

          {/* User badge — clicável para abrir modal de conta */}
          {currentUser && (
            <motion.button
              onClick={() => setAccountOpen(true)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}
              title="Minha conta"
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

          {/* Minha conta — mobile (só ícone) */}
          {currentUser && (
            <motion.button
              onClick={() => setAccountOpen(true)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
              className="sm:hidden p-2 rounded-xl transition-colors"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
              title="Minha conta"
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

      {/* Modal minha conta */}
      <AnimatePresence>
        {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
