// src/components/layout/BottomNav.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp  } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, Flame, Calendar,
  Wallet, Target, CalendarCheck, Shield, MoreHorizontal, Lightbulb,
} from 'lucide-react';

// Itens fixos na barra inferior (4 + FAB central)
const LEFT_ITEMS = [
  { id: 'tasks',  label: 'Tarefas', icon: CheckSquare },
  { id: 'habits', label: 'Hábitos', icon: Flame },
];
const RIGHT_ITEMS = [
  { id: 'agenda',  label: 'Agenda',     icon: Calendar },
  { id: 'finance', label: 'Financeiro', icon: Wallet },
];
// Itens no sheet "Mais"
const MORE_BASE = [
  { id: 'goals',  label: 'Metas',   icon: Target },
  { id: 'weekly', label: 'Revisão', icon: CalendarCheck },
];

function NavBtn({ item, active, badge, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
      style={{
        minHeight: 60,
        color: active ? 'var(--text)' : 'var(--text-4)',
        transition: 'color 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {active && (
        <motion.div
          layoutId="bottom-indicator"
          className="absolute top-0 rounded-full"
          style={{ height: 2, width: 28, background: 'var(--accent-light)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        />
      )}
      <motion.div
        className="relative"
        animate={{ scale: active ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <Icon size={20} strokeWidth={active ? 2.3 : 1.6} />
        {badge != null && (
          <span
            className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
            style={{ background: 'var(--red)', lineHeight: 1 }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </motion.div>
      <span className="text-[9px] font-medium leading-none tracking-wide uppercase" style={{ letterSpacing: '0.04em' }}>
        {item.label}
      </span>
    </button>
  );
}

export default function BottomNav() {
  const { activeTab, setActiveTab, tasks, habits } = useApp();
  const { currentUser } = useAuth();
  const isAdmin  = currentUser?.role === 'admin';
  const [moreOpen, setMoreOpen] = useState(false);

  const todayStr     = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const habitsLeft   = habits.filter((h) => !h.completedDates?.includes(todayStr)).length;
  const badges       = { tasks: pendingTasks || null, habits: habitsLeft || null };

  const allMore = isAdmin
    ? [...MORE_BASE, { id: 'admin',    label: 'Admin',     icon: Shield }]
    : [...MORE_BASE, { id: 'feedback', label: 'Sugestões', icon: Lightbulb }];

  const isMoreActive = allMore.some((i) => i.id === activeTab);

  const goTo = (id) => { setActiveTab(id); setMoreOpen(false); };
  const homeActive = activeTab === 'dashboard';

  return (
    <>
      <nav
        className="lg:hidden fixed left-0 right-0 bottom-0 z-30 flex"
        style={{
          background:    'var(--sidebar-bg)',
          borderTop:     '1px solid var(--border-md)',
          boxShadow:     '0 -6px 28px rgba(0,0,0,0.45)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height:        60,
          overflow:      'visible',
        }}
      >
        {LEFT_ITEMS.map((item) => (
          <NavBtn
            key={item.id}
            item={item}
            active={activeTab === item.id}
            badge={badges[item.id]}
            onClick={() => goTo(item.id)}
          />
        ))}

        {/* FAB central — Dashboard */}
        <div style={{ flex: '1 1 0%', position: 'relative', overflow: 'visible' }}>
          <motion.button
            type="button"
            onClick={() => goTo('dashboard')}
            style={{
              position:  'absolute',
              left:      '50%',
              bottom:    10,
              transform: 'translateX(-50%)',
              width:  52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              WebkitTapHighlightColor: 'transparent',
              background: homeActive ? 'var(--blue)' : 'var(--bg-raised)',
              boxShadow: homeActive
                ? '0 0 0 3px var(--blue-border), 0 4px 18px rgba(58,90,64,0.40)'
                : '0 2px 10px rgba(0,0,0,0.50)',
              border: homeActive
                ? '2px solid var(--blue-border)'
                : '2px solid var(--border-md)',
              color: homeActive ? 'var(--on-blue)' : 'var(--text-4)',
            }}
            animate={{ scale: homeActive ? 1.06 : 1 }}
            whileHover={{ scale: 1.10 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <LayoutDashboard size={22} strokeWidth={homeActive ? 2.2 : 1.7} />
          </motion.button>
        </div>

        {RIGHT_ITEMS.map((item) => (
          <NavBtn
            key={item.id}
            item={item}
            active={activeTab === item.id}
            badge={badges[item.id]}
            onClick={() => goTo(item.id)}
          />
        ))}

        {/* Botão Mais */}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
          style={{
            minHeight: 60,
            color: isMoreActive || moreOpen ? 'var(--text)' : 'var(--text-4)',
            transition: 'color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {(isMoreActive && !moreOpen) && (
            <motion.div
              layoutId="bottom-indicator"
              className="absolute top-0 rounded-full"
              style={{ height: 2, width: 28, background: 'var(--accent-light)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            />
          )}
          <motion.div
            animate={{ rotate: moreOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            <MoreHorizontal size={20} strokeWidth={1.6} />
          </motion.div>
          <span className="text-[9px] font-medium leading-none uppercase" style={{ letterSpacing: '0.04em' }}>
            Mais
          </span>
        </button>
      </nav>

      {/* Sheet "Mais" */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 z-[40]"
              style={{ background: 'rgba(0,0,0,0.65)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.20 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="sheet"
              className="lg:hidden fixed left-0 right-0 z-[50] rounded-t-3xl"
              style={{
                bottom:        0,
                background:    'var(--bg-soft)',
                borderTop:     '1px solid var(--border-md)',
                boxShadow:     '0 -12px 44px rgba(0,0,0,0.55)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)',
              }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mx-auto mt-3 mb-5 rounded-full"
                style={{ width: 36, height: 3, background: 'var(--border-strong)' }} />

              <div className="px-5 pb-2">
                <p className="label mb-4">MAIS SEÇÕES</p>
                <div className="grid grid-cols-3 gap-3">
                  {allMore.map((item, i) => {
                    const Icon   = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => goTo(item.id)}
                        className="flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl transition-colors"
                        style={{
                          background: active ? 'var(--blue)'   : 'var(--bg-muted)',
                          color:      active ? 'var(--on-blue)': 'var(--text-3)',
                          border:     '1px solid ' + (active ? 'var(--blue-border)' : 'var(--border)'),
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035, duration: 0.20 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
                        <span className="text-xs font-medium text-center" style={{ lineHeight: 1.2 }}>
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
