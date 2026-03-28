// src/App.jsx — page transitions + animated loading screen
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth }    from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage      from './components/auth/LoginPage';
import Sidebar        from './components/layout/Sidebar';
import Header         from './components/layout/Header';
import Dashboard      from './components/dashboard/Dashboard';
import Tasks          from './components/tasks/Tasks';
import Habits         from './components/habits/Habits';
import Finance        from './components/finance/Finance';
import Study          from './components/study/Study';
import Notes          from './components/notes/Notes';
import Goals          from './components/goals/Goals';
import Pomodoro       from './components/pomodoro/Pomodoro';
import Weekly         from './components/weekly/Weekly';
import Agenda         from './components/agenda/Agenda';
import AdminPanel     from './components/admin/AdminPanel';
import CommandPalette from './components/ui/CommandPalette';
import { Zap }        from 'lucide-react';

const VIEWS = {
  dashboard: Dashboard,
  tasks:     Tasks,
  habits:    Habits,
  agenda:    Agenda,
  finance:   Finance,
  goals:     Goals,
  study:     Study,
  notes:     Notes,
  pomodoro:  Pomodoro,
  weekly:    Weekly,
  admin:     AdminPanel,
};

const SHORTCUTS = {
  '1':'dashboard','2':'tasks','3':'habits','4':'agenda',
  '5':'finance','6':'goals','7':'study','8':'notes','9':'pomodoro','0':'weekly',
};

// Page transition variants
const pageVariants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -8 },
};
const pageTransition = { duration: 0.2, ease: 'easeOut' };

function AppShell() {
  const { activeTab, setActiveTab } = useApp();
  const [cmdOpen, setCmdOpen] = useState(false);
  const View = VIEWS[activeTab] || Dashboard;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); setCmdOpen((o) => !o); return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (SHORTCUTS[e.key]) setActiveTab(SHORTCUTS[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTab]);

  return (
    <div className="flex min-h-screen font-sans" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onOpenCmd={() => setCmdOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <View />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:"var(--blue)",boxShadow:"0 8px 24px var(--blue-bg)"}}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Zap size={28} className="text-ink" fill="currentColor" />
        </motion.div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--blue)', animation: 'bounce 1.2s ease-in-out 0s infinite' }} />
          <div className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--blue)', animation: 'bounce 1.2s ease-in-out 0.2s infinite' }} />
          <div className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--blue)', animation: 'bounce 1.2s ease-in-out 0.4s infinite' }} />
        </div>
        <p className="text-sm font-mono" style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
          Verificando sessão...
        </p>
      </motion.div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

export default function App() {
  const { currentUser, currentUserId, loading } = useAuth();

  if (loading)      return <LoadingScreen />;
  if (!currentUser) return <LoginPage />;

  return (
    <AppProvider key={currentUserId} userId={currentUserId} username={currentUser.username}>
      <AppShell />
    </AppProvider>
  );
}
