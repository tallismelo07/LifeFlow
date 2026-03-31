// src/components/layout/Sidebar.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useApp }  from '../../context/AppContext';
import { useNav }  from '../../context/NavContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, Flame, Wallet,
  Leaf, X, Target, Shield, Lightbulb,
} from 'lucide-react';

const getNavItems = (isAdmin) => [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, shortcut: '1' },
  { id: 'tasks',     label: 'Tarefas',    icon: CheckSquare,     shortcut: '2' },
  { id: 'habits',    label: 'Hábitos',    icon: Flame,           shortcut: '3' },
  { id: 'finance',   label: 'Financeiro', icon: Wallet,          shortcut: '4' },
  { id: 'goals',     label: 'Metas',      icon: Target,          shortcut: '5' },
  ...(!isAdmin ? [{ id: 'feedback', label: 'Sugestões', icon: Lightbulb, shortcut: 'F' }] : []),
  ...(isAdmin  ? [{ id: 'admin',    label: 'Admin',     icon: Shield,    shortcut: 'A', isAdmin: true }] : []),
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

  const isAdmin   = currentUser?.role === 'admin';
  const NAV_ITEMS = getNavItems(isAdmin);
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
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--blue)', boxShadow: '0 2px 10px rgba(58,90,64,0.35)' }}
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Leaf size={15} style={{ color: 'var(--on-blue)' }} strokeWidth={2} />
          </motion.div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>LifeFlow</span>
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
          style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'var(--blue)', color: 'var(--on-blue)' }}
            >
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none truncate" style={{ color: 'var(--text)' }}>
                {currentUser.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                {isAdmin ? 'Administrador' : 'Usuário'}
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

      <div className="px-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11px] font-mono" style={{ color: 'var(--text-4)' }}>
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
