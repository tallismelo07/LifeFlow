// src/components/layout/BottomNav.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNav  } from '../../context/NavContext';
import { useAuth } from '../../context/AuthContext';
import {
  Home, LayoutDashboard, Wallet, Flame,
  CheckSquare, Target, Shield, Lightbulb,
  MoreHorizontal, Calendar, CalendarCheck,
} from 'lucide-react';

// 5 itens fixos na tab bar
const NAV_ITEMS = [
  { id: 'home',      label: 'Início',   icon: Home            },
  { id: 'dashboard', label: 'Atlas',    icon: LayoutDashboard },
  { id: 'tasks',     label: 'Trilha',   icon: CheckSquare     },
  { id: 'finance',   label: 'Finanças', icon: Wallet          },
  { id: 'habits',    label: 'Rotina',   icon: Flame           },
];

// Itens do menu "Mais"
const MORE_BASE = [
  { id: 'agenda',  label: 'Agenda',     icon: Calendar      },
  { id: 'goals',   label: 'Metas',      icon: Target        },
  { id: 'checkin', label: 'Check-in',   icon: CalendarCheck },
];

// ── Botão de tab ─────────────────────────────────────────────
function TabBtn({ item, active, badge, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
      style={{
        minHeight: 58,
        color: active ? 'var(--text)' : 'var(--text-4)',
        transition: 'color 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute top-0 rounded-full"
          style={{ height: 2, width: 24, background: 'var(--text-2)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        />
      )}

      <motion.div
        className="relative"
        animate={{ scale: active ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <Icon size={19} strokeWidth={active ? 2.2 : 1.6} />
        {badge != null && (
          <span
            className="absolute -top-1 -right-1.5 min-w-[13px] h-[13px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
            style={{ background: 'var(--red)', lineHeight: 1 }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </motion.div>

      <span
        className="text-[9px] font-medium leading-none uppercase"
        style={{ letterSpacing: '0.04em' }}
      >
        {item.label}
      </span>
    </button>
  );
}

export default function BottomNav() {
  const { activeTab, setActiveTab } = useNav();
  const { currentUser } = useAuth();
  const isAdmin  = currentUser?.role === 'admin';
  const [moreOpen, setMoreOpen] = useState(false);

  const allMore = [
    ...MORE_BASE,
    ...(isAdmin
      ? [{ id: 'admin',    label: 'Admin',     icon: Shield    }]
      : [{ id: 'feedback', label: 'Sugestões', icon: Lightbulb }]
    ),
  ];

  const isMoreActive = allMore.some((i) => i.id === activeTab);

  const goTo = (id) => { setActiveTab(id); setMoreOpen(false); };

  return (
    <>
      {/* ── Tab bar ─────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed left-0 right-0 bottom-0 z-30 flex"
        style={{
          background:    'var(--sidebar-bg)',
          borderTop:     '1px solid var(--border-md)',
          boxShadow:     '0 -4px 24px rgba(0,0,0,0.40)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height:        58,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <TabBtn
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => goTo(item.id)}
          />
        ))}

        {/* Botão Mais */}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
          style={{
            minHeight: 58,
            color: isMoreActive || moreOpen ? 'var(--text)' : 'var(--text-4)',
            transition: 'color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {(isMoreActive && !moreOpen) && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute top-0 rounded-full"
              style={{ height: 2, width: 24, background: 'var(--text-2)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            />
          )}
          <motion.div
            animate={{ rotate: moreOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            <MoreHorizontal size={19} strokeWidth={1.6} />
          </motion.div>
          <span className="text-[9px] font-medium leading-none uppercase" style={{ letterSpacing: '0.04em' }}>
            Mais
          </span>
        </button>
      </nav>

      {/* ── Sheet "Mais" ─────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 z-[40]"
              style={{ background: 'rgba(0,0,0,0.60)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
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
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 66px)',
              }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div
                className="mx-auto mt-3 mb-5 rounded-full"
                style={{ width: 36, height: 3, background: 'var(--border-strong)' }}
              />
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
                          background: active ? 'var(--blue)'    : 'var(--bg-muted)',
                          color:      active ? 'var(--on-blue)' : 'var(--text-3)',
                          border:     `1px solid ${active ? 'var(--blue-border)' : 'var(--border)'}`,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.18 }}
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
