// src/components/layout/Header.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useApp }   from '../../context/AppContext';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Search, LogOut, Shield, Sun, Moon } from 'lucide-react';

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

export default function Header({ onOpenCmd }) {
  const { activeTab, setSidebarOpen } = useApp();
  const { currentUser, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { title, sub } = TITLES[activeTab] || TITLES.dashboard;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header
      className="flex items-center justify-between px-5 lg:px-8 py-4 sticky top-0 z-10 border-b backdrop-blur-sm"
      style={{
        background: 'var(--header-bg)',
        borderColor: 'var(--border)',
      }}
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
          <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-3)' }}>
            {sub}
          </p>
        </div>
      </div>

      {/* Right: user pill + controls */}
      <div className="flex items-center gap-2">

        {/* User badge */}
        {currentUser && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{
              background: 'var(--blue-bg)',
              border: '1px solid var(--blue-border)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'var(--blue)' }}
            >
              {currentUser.avatar}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>
              {currentUser.name}
            </span>
            {isAdmin && (
              <Shield size={11} style={{ color: 'var(--amber)' }} />
            )}
          </div>
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
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-md)',
            color: 'var(--text-3)',
          }}
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

        {/* Logout */}
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
          title="Sair"
        >
          <LogOut size={16} />
        </motion.button>
      </div>
    </header>
  );
}
