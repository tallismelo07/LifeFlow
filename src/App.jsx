// src/App.jsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth }  from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NavProvider, useNav } from './context/NavContext';
import { Leaf } from 'lucide-react';

import { ToastProvider } from './context/ToastContext';
import LoginPage      from './components/auth/LoginPage';
import WelcomeScreen  from './components/auth/WelcomeScreen';
import Sidebar        from './components/layout/Sidebar';
import BottomNav      from './components/layout/BottomNav';
import Header         from './components/layout/Header';

import Home       from './components/home/Home';
import CheckIn    from './components/checkin/CheckIn';
import Dashboard  from './components/dashboard/Dashboard';
import Tasks      from './components/tasks/Tasks';
import Habits     from './components/habits/Habits';
import Agenda     from './components/agenda/Agenda';
import Finance    from './components/finance/Finance';
import Goals      from './components/goals/Goals';
import AdminPanel from './components/admin/AdminPanel';
import Feedback   from './components/feedback/Feedback';
import Pomodoro   from './components/pomodoro/Pomodoro';
import CommandPalette from './components/ui/CommandPalette';

// ─────────────────────────────────────────────────────────────

const VIEWS = {
  home:      Home,
  checkin:   CheckIn,
  dashboard: Dashboard,
  tasks:     Tasks,
  habits:    Habits,
  agenda:    Agenda,
  finance:   Finance,
  goals:     Goals,
  admin:     AdminPanel,
  feedback:  Feedback,
  pomodoro:  Pomodoro,
};

const SHORTCUTS = {
  '1': 'home', '2': 'dashboard', '3': 'tasks',
  '4': 'finance', '5': 'goals',
};

const pageVariants  = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
const pageTransition = { duration: 0.2, ease: 'easeOut' };

// ─────────────────────────────────────────────────────────────

function AppShell() {
  const { activeTab, setActiveTab } = useNav();   // ← NavContext (não muda com dados)
  const [cmdOpen, setCmdOpen] = useState(false);

  const View = VIEWS[activeTab] || Home;

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
    <div
      className="flex font-sans"
      style={{
        background: 'var(--bg)',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
      }}
    >
      <Sidebar />
      <main
        className="flex-1 flex flex-col min-w-0"
        style={{ overflow: 'hidden', minWidth: 0 }}
      >
        <Header onOpenCmd={() => setCmdOpen(true)} />
        {/* Único elemento scrollável — header e nav ficam fixos */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)',
            WebkitOverflowScrolling: 'touch',
          }}
          className="lg:pb-0"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
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

// ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
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
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Verificando sessão...</p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function AuthenticatedApp({ user }) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const sessionKey = `lf_welcomed_${user.username}`;
    if (!sessionStorage.getItem(sessionKey)) {
      setShowWelcome(true);
      sessionStorage.setItem(sessionKey, '1');
    }
  }, [user.username]);

  return (
    <ToastProvider>
      <NavProvider>
        <AppProvider key={user.username}>
          {showWelcome && (
            <WelcomeScreen user={user} onDone={() => setShowWelcome(false)} />
          )}
          <AppShell />
        </AppProvider>
      </NavProvider>
    </ToastProvider>
  );
}

// ─────────────────────────────────────────────────────────────

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading)      return <LoadingScreen />;
  if (!currentUser) return <LoginPage />;

  return <AuthenticatedApp user={currentUser} />;
}
