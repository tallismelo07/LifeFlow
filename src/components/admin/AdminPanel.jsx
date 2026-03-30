// src/components/admin/AdminPanel.jsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth }   from '../../context/AuthContext';
import { Shield, Wifi, WifiOff, Clock, Users, RefreshCw } from 'lucide-react';

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

export default function AdminPanel() {
  const { currentUser, isAdmin, activityUsers, fetchActivityUsers } = useAuth();

  useEffect(() => {
    if (!isAdmin) return;
    fetchActivityUsers();
    const id = setInterval(fetchActivityUsers, 30_000);
    return () => clearInterval(id);
  }, [isAdmin, fetchActivityUsers]);

  if (!isAdmin) return null;

  // Outros usuários (exclui o próprio admin da lista)
  const others      = activityUsers.filter((u) => u.username !== currentUser?.username);
  const onlineCount = others.filter((u) => u.is_online).length;

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.22}} className="p-6 lg:p-8 space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-amber/15 rounded-xl flex items-center justify-center">
            <Shield size={18} style={{color:'var(--amber)'}} />
          </div>
          <div>
            <h2 className="font-bold text-xl text-cream">Painel de Admin</h2>
            <p className="text-xs text-cream/40 mt-0.5">Visão geral dos usuários</p>
          </div>
        </div>
        <button onClick={fetchActivityUsers}
          className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream/40 hover:text-cream transition-colors border border-white/8">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-ink-soft border border-white/8 rounded-2xl p-4 text-center">
          <p className="label mb-2">TOTAL</p>
          <p className="font-bold text-3xl text-cream">{others.length}</p>
          <p className="text-xs text-cream/30 mt-1">usuários</p>
        </div>
        <div className="bg-ink-soft border border-white/8 rounded-2xl p-4 text-center">
          <p className="label mb-2">ONLINE</p>
          <p className="font-bold text-3xl ">{onlineCount}</p>
          <p className="text-xs text-cream/30 mt-1">agora</p>
        </div>
        <div className="bg-ink-soft border border-white/8 rounded-2xl p-4 text-center">
          <p className="label mb-2">OFFLINE</p>
          <p className="font-bold text-3xl text-cream/40">{others.length - onlineCount}</p>
          <p className="text-xs text-cream/30 mt-1">usuários</p>
        </div>
      </div>

      {/* Users list */}
      <div className="bg-ink-soft border border-white/8 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/6">
          <Users size={15} className="text-cream/40" />
          <h3 className="font-semibold text-cream text-sm">Usuários do sistema</h3>
        </div>

        {others.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-cream/30 text-sm">
            {activityUsers.length === 0 ? 'Carregando...' : 'Nenhum usuário encontrado.'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {others.map((u) => {
              const online = !!u.is_online;
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                    style={{ backgroundColor: u.color || '#6B7280' }}>
                    {u.avatar || u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-cream text-sm">{u.name}</p>
                      <span className="text-xs font-mono text-cream/25">@{u.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={11} className="text-cream/30" />
                      <span className="text-xs text-cream/40">
                        {online ? 'Online agora' : u.last_login ? `Último acesso ${timeAgo(u.last_login)}` : 'Nunca acessou'}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={online
                      ? { background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)' }
                      : { background: 'var(--bg-muted)', border: '1px solid var(--border-md)',    color: 'var(--text-3)' }
                    }
                  >
                    {online ? <><Wifi size={11} /> Online</> : <><WifiOff size={11} /> Offline</>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-4 flex gap-3">
        <Shield size={14} className="text-accent-amber shrink-0 mt-0.5" />
        <p className="text-xs text-cream/50 leading-relaxed">
          Você pode ver o status e último acesso, mas{' '}
          <strong className="text-cream/70">não tem acesso aos dados pessoais</strong>{' '}
          de outros usuários.
        </p>
      </div>
    </motion.div>
  );
}
