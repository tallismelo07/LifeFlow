// src/App.jsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';

import LoginPage      from './components/auth/LoginPage';
import WelcomeScreen  from './components/auth/WelcomeScreen';
import Sidebar        from './components/layout/Sidebar';
import BottomNav      from './components/layout/BottomNav';
import Header         from './components/layout/Header';

import Dashboard  from './components/dashboard/Dashboard';
import Tasks      from './components/tasks/Tasks';
import Habits     from './components/habits/Habits';
import Finance    from './components/finance/Finance';
import Goals      from './components/goals/Goals';
import Weekly     from './components/weekly/Weekly';
import Agenda     from './components/agenda/Agenda';
import AdminPanel from './components/admin/AdminPanel';
import Feedback   from './components/feedback/Feedback';
import CommandPalette from './components/ui/CommandPalette';
import { Leaf } from 'lucide-react';

// ─────────────────────────────────────────────

const VIEWS = {
  dashboard: Dashboard,
  tasks:     Tasks,
  habits:    Habits,
  agenda:    Agenda,
  finance:   Finance,
  goals:     Goals,
  weekly:    Weekly,
  admin:     AdminPanel,
  feedback:  Feedback,
};

const SHORTCUTS = {
  '1': 'dashboard', '2': 'tasks',  '3': 'habits',
  '4': 'agenda',    '5': 'finance','6': 'goals',
  '7': 'weekly',
};

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};
const pageTransition = { duration: 0.2, ease: 'easeOut' };

// ─────────────────────────────────────────────

function AppShell() {
  const { activeTab, setActiveTab } = useApp();
  const [cmdOpen, setCmdOpen] = useState(false);

  const View = VIEWS[activeTab] || Dashboard;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
        return;
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
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
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
      <BottomNav />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--blue)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Leaf size={26} style={{ color: 'var(--on-blue)' }} strokeWidth={1.8} />
        </motion.div>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Verificando sessão...</p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────

function AuthenticatedApp({ user }) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Mostra a tela de boas-vindas apenas em logins novos (não em reload)
    const sessionKey = `lf_welcomed_${user.username}`;
    const alreadyWelcomed = sessionStorage.getItem(sessionKey);
    if (!alreadyWelcomed) {
      setShowWelcome(true);
      sessionStorage.setItem(sessionKey, '1');
    }
  }, [user.username]);

  return (
    <AppProvider key={user.username}>
      {showWelcome && (
        <WelcomeScreen
          user={user}
          onDone={() => setShowWelcome(false)}
        />
      )}
      <AppShell />
    </AppProvider>
  );
}

// ─────────────────────────────────────────────

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading)      return <LoadingScreen />;
  if (!currentUser) return <LoginPage />;

  return <AuthenticatedApp user={currentUser} />;
}
