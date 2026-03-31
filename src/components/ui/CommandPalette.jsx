// src/components/ui/CommandPalette.jsx — animated command palette
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNav }  from '../../context/NavContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search, LayoutDashboard, CheckSquare, Flame, Wallet,
  Target, Shield, LogOut, Calendar,
} from 'lucide-react';

const BASE_COMMANDS = [
  { id:'dashboard', label:'Dashboard',  icon:LayoutDashboard, tab:'dashboard', group:'Navegação' },
  { id:'tasks',     label:'Tarefas',    icon:CheckSquare,     tab:'tasks',     group:'Navegação' },
  { id:'agenda',    label:'Agenda',     icon:Calendar,        tab:'tasks',     group:'Navegação' },
  { id:'habits',    label:'Hábitos',    icon:Flame,           tab:'habits',    group:'Navegação' },
  { id:'finance',   label:'Financeiro', icon:Wallet,          tab:'finance',   group:'Navegação' },
  { id:'goals',     label:'Metas',      icon:Target,          tab:'goals',     group:'Navegação' },
];

export default function CommandPalette({ open, onClose }) {
  const { setActiveTab }   = useNav();
  const { currentUser, logout } = useAuth();
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const isAdmin  = currentUser?.role === 'admin';
  const commands = [
    ...BASE_COMMANDS,
    ...(isAdmin ? [{ id:'admin', label:'Painel Admin', icon:Shield, tab:'admin', group:'Admin' }] : []),
    { id:'logout', label:'Sair / Logout', icon:LogOut, tab:null, group:'Conta', action:() => { logout(); onClose(); } },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);
  useEffect(() => { setSelected(0); }, [query]);

  const execute = (cmd) => {
    if (cmd.action) cmd.action();
    else if (cmd.tab) setActiveTab(cmd.tab);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s+1, filtered.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s-1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) execute(filtered[selected]);
    if (e.key === 'Escape') onClose();
  };

  const groups = [...new Set(filtered.map((c) => c.group))];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.65)' }} />
          <motion.div
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-md)' }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1,    y: 0    }}
            exit={{   opacity: 0, scale: 0.95, y: -10   }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search size={16} style={{ color: 'color-mix(in srgb, var(--text) 40%, transparent)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Digite um comando..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text)' }}
              />
              <kbd className="text-xs font-mono px-2 py-1 rounded-lg"
                style={{ background: 'var(--bg-muted)', color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-sm py-8"
                  style={{ color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
                  Nenhum comando encontrado
                </p>
              ) : groups.map((group) => (
                <div key={group}>
                  <p className="px-4 py-2 text-xs font-mono uppercase tracking-wider"
                    style={{ color: 'color-mix(in srgb, var(--text) 25%, transparent)' }}>
                    {group}
                  </p>
                  {filtered.filter((c) => c.group === group).map((cmd) => {
                    const idx  = filtered.indexOf(cmd);
                    const Icon = cmd.icon;
                    const isSelected = selected === idx;
                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                        style={{
                          background: isSelected ? 'rgba(200,241,53,0.08)' : 'transparent',
                          color: isSelected ? 'var(--green)' : 'color-mix(in srgb, var(--text) 70%, transparent)',
                        }}
                        whileHover={{ x: 2 }}
                      >
                        <Icon size={15} />
                        <span className="flex-1">{cmd.label}</span>
                        {isSelected && (
                          <kbd className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'var(--bg-muted)', color: 'color-mix(in srgb, var(--text) 30%, transparent)' }}>
                            ↵
                          </kbd>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 flex items-center gap-4 text-xs font-mono"
              style={{ borderTop: '1px solid var(--border)', color: 'color-mix(in srgb, var(--text) 25%, transparent)' }}>
              <span>↑↓ navegar</span>
              <span>↵ executar</span>
              <span>ESC fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
