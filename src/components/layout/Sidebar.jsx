// src/components/layout/Sidebar.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useApp }  from '../../context/AppContext';
import { useNav }  from '../../context/NavContext';
import { useAuth } from '../../context/AuthContext';
import {
  Home, LayoutDashboard, CheckSquare, Flame, Wallet,
  Leaf, X, Target, Shield, Lightbulb, Calendar, CalendarCheck,
  Timer,
} from 'lucide-react';

// Itens completos (outros usuários)
const getNavItems = (isAdmin) => [
  { id: 'home',      label: 'Início',     icon: Home,            shortcut: '1' },
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, shortcut: '2' },
  { id: 'tasks',     label: 'Tarefas',    icon: CheckSquare,     shortcut: '3' },
  { id: 'habits',    label: 'Hábitos',    icon: Flame,           shortcut: '4' },
  { id: 'agenda',    label: 'Agenda',     icon: Calendar,        shortcut: '5' },
  { id: 'finance',   label: 'Financeiro', icon: Wallet,          shortcut: '6' },
  { id: 'goals',     label: 'Metas',      icon: Target,          shortcut: '7' },
  { id: 'checkin',   label: 'Check-in',   icon: CalendarCheck,   shortcut: 'C' },
  ...(!isAdmin ? [{ id: 'feedback', label: 'Sugestões', icon: Lightbulb, shortcut: 'F' }] : []),
  ...(isAdmin  ? [{ id: 'admin',    label: 'Admin',     icon: Shield,    shortcut: 'A', isAdmin: true }] : []),
];

// Itens reduzidos para Tallis (admin)
const TALLIS_NAV_ITEMS = [
  { id: 'home',      label: 'Início',     icon: Home,            shortcut: '1' },
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, shortcut: '2' },
  { id: 'finance',   label: 'Financeiro', icon: Wallet,          shortcut: '3' },
  { id: 'checkin',   label: 'Check-in',   icon: CalendarCheck,   shortcut: 'C' },
  { id: 'pomodoro',  label: 'Pomodoro',   icon: Timer,           shortcut: 'P' },
  { id: 'admin',     label: 'Admin',      icon: Shield,          shortcut: 'A', isAdmin: true },
];

function NavItem({ item, isActive, onClick, badge }) {
  const { label, icon: Icon, shortcut, isAdmin: itemIsAdmin } = item;
  return (
    <motion.button
      onClick={onClick}
      className={`nav-item w-full text-left group ${isActive ? 'nav-item-active' : ''}`}
      whileHover={{ x: isActive ? 0 : 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {itemIsAdmin && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-border)' }}>
          ADMIN
        </span>
      )}
      {badge ? (
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          style={{ background: 'var(--red)', color: '#fff' }}
        >
          {badge}
        </motion.span>
      ) : !itemIsAdmin ? (
        <kbd className="text-xs font-mono opacity-0 group-hover:opacity-30 transition-opacity hidden lg:block"
          style={{ color: 'var(--text-4)' }}>
          {shortcut}
        </kbd>
      ) : null}
    </motion.button>
  );
}

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useNav();
  const { tasks, habits } = useApp();
  const { currentUser } = useAuth();

  const isAdmin     = currentUser?.role === 'admin';
  const isTallis    = currentUser?.username === 'tallis';
  const NAV_ITEMS   = isTallis ? TALLIS_NAV_ITEMS : getNavItems(isAdmin);

  const todayStr  = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const habitsLeft   = habits.filter((h) => !h.completedDates.includes(todayStr)).length;
  const badges = { tasks: pendingTasks || null, habits: habitsLeft || null };

  const navigate = (id) => { setActiveTab(id); setSidebarOpen(false); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full pt-5 pb-6 px-3"
      style={{ background: 'var(--sidebar-bg)' }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--text)', boxShadow: 'none' }}
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Leaf size={14} style={{ color: '#ffffff' }} strokeWidth={2} />
          </motion.div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', color: 'var(--text)' }}>LifeFlow</span>
        </div>
        <motion.button
          onClick={() => setSidebarOpen(false)}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="lg:hidden p-1.5 rounded-xl transition-colors"
          style={{ color: 'var(--text-3)', background: 'var(--bg-muted)' }}
        >
          <X size={16} />
        </motion.button>
      </div>

      {/* User card */}
      {currentUser && (
        <motion.div
          className="mx-1 mb-5 px-3 py-3 rounded-xl"
          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-md)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'var(--text)', color: '#ffffff' }}
            >
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1, color: 'var(--text)' }} className="truncate">
                {currentUser.name}
              </p>
              <p style={{ fontSize: 12, marginTop: 3, color: 'var(--text-4)' }}>
                {isTallis ? 'Admin · Modo foco' : isAdmin ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-2 px-2">
        <p className="label text-[10px]">MENU</p>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto px-1">
        {NAV_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.025 + 0.08 }}
          >
            <NavItem
              item={item}
              isActive={activeTab === item.id}
              onClick={() => navigate(item.id)}
              badge={badges[item.id]}
            />
          </motion.div>
        ))}
      </nav>

      <div className="px-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-md)' }}>
        <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-4)' }}>
          Ctrl+K · comandos rápidos
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex w-64 min-h-screen flex-col shrink-0 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed top-0 left-0 z-50 h-full w-72 flex flex-col lg:hidden border-r"
              style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
