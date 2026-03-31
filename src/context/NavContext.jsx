// src/context/NavContext.jsx
// ─────────────────────────────────────────────────────────────────
//  Contexto EXCLUSIVO de navegação.
//
//  POR QUE SEPARADO DO AppContext?
//  AppContext muda em toda operação de dados (tasks, habits, etc.).
//  BottomNav e Sidebar assinavam AppContext → re-renderizavam a cada
//  save / polling / qualquer mutação → flickering visível.
//
//  NavContext só muda quando o usuário troca de aba ou abre a sidebar
//  (eventos raros). Isso garante que o menu NUNCA re-renderiza durante
//  operações de dados ou salvamento.
// ─────────────────────────────────────────────────────────────────

import { createContext, useContext, useState } from 'react';

const NavContext = createContext(null);

export function NavProvider({ children }) {
  const [activeTab,   setActiveTab]   = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NavContext.Provider value={{ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav deve ser usado dentro de NavProvider');
  return ctx;
}
