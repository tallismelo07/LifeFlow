// src/components/ui/index.jsx — Design system v3 with Framer Motion
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// ── Shared animation presets ─────────────────────────────────────────────────
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: 'easeOut' },
};
export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
};

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', hover = false, animate = false, delay = 0, ...props }) {
  if (animate) {
    return (
      <motion.div
        className={`card ${hover ? 'card-hover' : ''} ${className}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay }}
        whileHover={hover ? { y: -2, boxShadow: 'var(--shadow-md)' } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) {
  const cls = {
    primary: 'btn-primary',
    ghost:   'btn-ghost',
    danger:  'btn-danger',
  }[variant] || 'btn-primary';

  const sz = { sm: 'text-xs px-3 py-1.5', md: '', lg: 'text-base px-6 py-3' }[size] || '';

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled  ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      disabled={disabled}
      className={`${cls} ${sz} ${className} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="label">{label}</span>}
      <input className={`input-base ${className}`} {...props} />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, rows = 3, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="label">{label}</span>}
      <textarea className={`input-base resize-none ${className}`} rows={rows} {...props} />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="label">{label}</span>}
      <select
        className={`input-base ${className}`}
        style={{ colorScheme: 'inherit' }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  blue:  { bg: 'var(--blue-bg)',   color: 'var(--blue)',   border: 'var(--blue-border)'  },
  green: { bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-border)' },
  amber: { bg: 'var(--amber-bg)',  color: 'var(--amber)',  border: 'var(--amber-border)' },
  red:   { bg: 'var(--red-bg)',    color: 'var(--red)',    border: 'var(--red-border)'   },
  gray:  { bg: 'var(--bg-muted)',  color: 'var(--text-3)', border: 'var(--border-md)'    },
  // Legacy aliases
  lime:  { bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-border)' },
  rose:  { bg: 'var(--red-bg)',    color: 'var(--red)',    border: 'var(--red-border)'   },
  teal:  { bg: 'rgba(20,184,166,0.10)', color: 'var(--teal)', border: 'rgba(20,184,166,0.25)' },
};
export function Badge({ children, color = 'gray', className = '' }) {
  const s = BADGE_STYLES[color] || BADGE_STYLES.gray;
  return (
    <span
      className={`tag ${className}`}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({ value = 0, color, className = '' }) {
  const pct = Math.min(100, Math.max(0, value));
  const bg  = color || 'var(--blue)';
  return (
    <div className={`progress-bar ${className}`}>
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ backgroundColor: bg }}
      />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.65)' }} />
          <motion.div
            className="relative rounded-2xl p-6 w-full max-w-lg"
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border-md)',
              boxShadow: 'var(--shadow-lg)',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{title}</h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-xl transition-colors"
                style={{ color: 'var(--text-3)', background: 'var(--bg-muted)' }}
              >
                <X size={15} />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="p-5 rounded-2xl mb-4"
        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-md)' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={28} style={{ color: 'var(--text-4)' }} />
      </motion.div>
      <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-2)' }}>{title}</p>
      {description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{description}</p>}
    </motion.div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color, icon: Icon, delay = 0 }) {
  const c = color || 'var(--blue)';
  return (
    <motion.div
      className="card flex flex-col gap-3"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
      style={{ cursor: 'default' }}
    >
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && (
          <div className="p-2 rounded-xl" style={{ background: c + '20' }}>
            <Icon size={14} style={{ color: c }} />
          </div>
        )}
      </div>
      <div>
        <p className="font-bold text-2xl leading-none" style={{ color: c }}>{value}</p>
        {sub && <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
    </motion.div>
  );
}
