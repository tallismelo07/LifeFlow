// src/components/admin/AdminPanel.jsx
// Painel do admin: atividade dos usuários + feedbacks + reset de senha

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  getFeedbacksRequest,
  getActivityRequest,
  resetPasswordRequest,
} from '../../services/authService';
import {
  Shield, Wifi, WifiOff, Clock, Users, RefreshCw,
  MessageSquare, KeyRound, Eye, EyeOff, CheckCircle2,
  Loader2, X, ChevronRight,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return 'nunca';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)   return 'agora mesmo';
  if (mins < 60)  return `há ${mins} min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days} dia${days !== 1 ? 's' : ''}`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'activity',  label: 'Atividade',  Icon: Users },
  { id: 'feedbacks', label: 'Feedbacks',  Icon: MessageSquare },
  { id: 'security',  label: 'Segurança',  Icon: Shield },
];

// ── Modal Reset de Senha ──────────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose }) {
  const [newPwd,   setNewPwd]   = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPwd.length < 3) { setError('Mínimo 3 caracteres.'); return; }
    setLoading(true);
    try {
      await resetPasswordRequest(user.username, newPwd);
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao resetar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed z-[70] left-1/2 top-1/2 w-full px-4"
        style={{ maxWidth: 380, translateX: '-50%', translateY: '-50%' }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-md)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}>
                <KeyRound size={15} style={{ color: 'var(--amber)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Reset de Senha</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>@{user.username}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-xl"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-3)' }}>
              <X size={14} />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={36} style={{ color: 'var(--green)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Senha resetada!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label block mb-1.5">NOVA SENHA</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="mínimo 3 caracteres"
                    value={newPwd}
                    onChange={(e) => { setNewPwd(e.target.value); setError(''); }}
                    className="input-base pr-10"
                    autoFocus disabled={loading}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-4)' }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-xs rounded-lg px-3 py-2"
                    style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={loading}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Confirmar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Aba: Atividade ────────────────────────────────────────────────────────────

function ActivityTab({ currentUser }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getActivityRequest();
      setUsers(data);
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const others      = users.filter((u) => u.username !== currentUser?.username);
  const onlineCount = others.filter((u) => u.is_online).length;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-bold text-2xl" style={{ color: 'var(--text)' }}>{others.length}</p>
            <p className="label text-[10px]">TOTAL</p>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--border)' }} />
          <div className="text-center">
            <p className="font-bold text-2xl" style={{ color: 'var(--green)' }}>{onlineCount}</p>
            <p className="label text-[10px]">ONLINE</p>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--border)' }} />
          <div className="text-center">
            <p className="font-bold text-2xl" style={{ color: 'var(--text-3)' }}>{others.length - onlineCount}</p>
            <p className="label text-[10px]">OFFLINE</p>
          </div>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
        </div>
      ) : others.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-4)' }}>Nenhum usuário encontrado.</p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {others.map((u, idx) => {
            const online = !!u.is_online;
            return (
              <div
                key={u.id}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors group"
                style={{
                  background: 'var(--bg-soft)',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: u.color || '#6B7280' }}
                >
                  {u.avatar || u.name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{u.name}</p>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>@{u.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} style={{ color: 'var(--text-4)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-4)' }}>
                      {online
                        ? `Visto ${timeAgo(u.last_seen)}`
                        : u.last_seen
                          ? `Último acesso ${timeAgo(u.last_seen)}`
                          : 'Nunca acessou'}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0"
                  style={online
                    ? { background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)' }
                    : { background: 'var(--bg-muted)', border: '1px solid var(--border-md)', color: 'var(--text-3)' }}
                >
                  {online ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {online ? 'Online' : 'Offline'}
                </div>

                {/* Reset senha */}
                <button
                  onClick={() => setResetTarget(u)}
                  title="Resetar senha"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-4)', background: 'var(--bg-muted)' }}
                >
                  <KeyRound size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {resetTarget && (
          <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Aba: Feedbacks ────────────────────────────────────────────────────────────

function FeedbacksTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getFeedbacksRequest();
      setFeedbacks(data);
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {feedbacks.length} sugestão{feedbacks.length !== 1 ? 'ões' : ''} recebida{feedbacks.length !== 1 ? 's' : ''}
        </p>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-4)' }} />
        </div>
      ) : feedbacks.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}
        >
          <MessageSquare size={32} className="mx-auto mb-3" style={{ color: 'var(--text-4)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhum feedback ainda.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Yasmin e Pedro podem enviar sugestões pela seção Feedback.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feedbacks.map((fb) => {
            const isOpen  = expanded === fb.id;
            const preview = fb.message.length > 80 ? fb.message.slice(0, 80) + '…' : fb.message;

            return (
              <motion.div
                key={fb.id}
                layout
                className="rounded-xl overflow-hidden cursor-pointer"
                style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}
                onClick={() => setExpanded(isOpen ? null : fb.id)}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: fb.color || '#6B7280' }}
                  >
                    {fb.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{fb.user_name}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>@{fb.username}</span>
                      <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-4)' }}>
                        {fmtDate(fb.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {isOpen ? fb.message : preview}
                    </p>
                  </div>

                  <ChevronRight
                    size={14}
                    style={{
                      color: 'var(--text-4)',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Aba: Segurança ────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4 flex gap-3"
        style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}
      >
        <Shield size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>Acesso restrito ao admin</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-3)' }}>
            Como admin você pode resetar a senha de qualquer usuário. Faça isso
            apenas quando solicitado. Vá para a aba <strong>Atividade</strong> e
            passe o mouse sobre o usuário para ver o botão de reset.
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}
      >
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Visibilidade de dados
        </h4>
        {[
          { label: 'Ver usuários e status online', allowed: true },
          { label: 'Ver feedbacks e sugestões',    allowed: true },
          { label: 'Resetar senha de usuários',    allowed: true },
          { label: 'Ver tarefas de outros',        allowed: false },
          { label: 'Ver notas de outros',          allowed: false },
          { label: 'Ver finanças de outros',       allowed: false },
        ].map(({ label, allowed }) => (
          <div key={label} className="flex items-center gap-3 py-2"
            style={{ borderTop: '1px solid var(--border)' }}>
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={allowed
                ? { background: 'var(--green-bg)', color: 'var(--green)' }
                : { background: 'var(--red-bg)', color: 'var(--red)' }}
            >
              {allowed ? '✓' : '✗'}
            </span>
            <span className="text-xs" style={{ color: allowed ? 'var(--text-2)' : 'var(--text-4)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AdminPanel principal ──────────────────────────────────────────────────────

export default function AdminPanel() {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('activity');

  if (!isAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="p-6 lg:p-8 space-y-5 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}
        >
          <Shield size={18} style={{ color: 'var(--amber)' }} />
        </div>
        <div>
          <h2 className="font-bold text-xl" style={{ color: 'var(--text)' }}>Painel de Admin</h2>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>Olá, {currentUser?.name}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex p-1 rounded-2xl gap-1"
        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all"
            style={activeTab === id
              ? { background: 'var(--blue)', color: 'var(--on-blue)' }
              : { color: 'var(--text-3)' }}
          >
            <Icon size={14} />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo da tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'activity'  && <ActivityTab currentUser={currentUser} />}
          {activeTab === 'feedbacks' && <FeedbacksTab />}
          {activeTab === 'security'  && <SecurityTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
