// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS  = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = {
  success: { bg: 'var(--green-bg)',  border: 'var(--green-border)', icon: 'var(--green)' },
  error:   { bg: 'var(--red-bg)',    border: 'var(--red-border)',   icon: 'var(--red)'   },
  info:    { bg: 'var(--blue-bg)',   border: 'var(--blue-border)',  icon: 'var(--blue)'  },
};

function ToastItem({ id, message, type, onRemove }) {
  const Icon   = ICONS[type] || ICONS.info;
  const colors = COLORS[type] || COLORS.info;

  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 3200);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -12, scale: 0.90  }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      onClick={() => onRemove(id)}
      style={{
        background:     colors.bg,
        border:         `1px solid ${colors.border}`,
        backdropFilter: 'blur(14px)',
        cursor:         'pointer',
        userSelect:     'none',
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        '10px 14px',
        borderRadius:   14,
        boxShadow:      '0 4px 24px rgba(0,0,0,0.45)',
        minWidth:       220,
        maxWidth:       340,
      }}
    >
      <Icon size={17} style={{ color: colors.icon, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
      <X size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        style={{
          position:      'fixed',
          top:           16,
          left:          '50%',
          transform:     'translateX(-50%)',
          zIndex:        9999,
          pointerEvents: 'none',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: 'auto' }}>
              <ToastItem {...t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
