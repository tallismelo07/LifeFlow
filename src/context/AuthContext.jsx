// src/context/AppContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { getDataRequest, saveDataRequest } from '../services/authService';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();

  const [userData, setUserData] = useState({
    tasks: [],
    habits: [],
    agenda: [],
    notes: [],
    goals: [],
    studyItems: []
  });

  const [loadingData, setLoadingData] = useState(true);

  // 🔥 CARREGA DADOS DO BACKEND (ESSENCIAL)
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        setLoadingData(true);

        const data = await getDataRequest();

        setUserData(data);
      } catch (err) {
        console.error('Erro ao carregar dados do servidor', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [currentUser]);

  // 💾 SALVA AUTOMATICAMENTE NO BACKEND
  useEffect(() => {
    if (!currentUser) return;

    const timeout = setTimeout(async () => {
      try {
        await saveDataRequest(userData);
      } catch (err) {
        console.error('Erro ao salvar dados', err);
      }
    }, 800); // debounce (evita spam)

    return () => clearTimeout(timeout);
  }, [userData, currentUser]);

  // 🧹 limpa ao deslogar
  useEffect(() => {
    if (!currentUser) {
      setUserData({
        tasks: [],
        habits: [],
        agenda: [],
        notes: [],
        goals: [],
        studyItems: []
      });
    }
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        userData,
        setUserData,
        loadingData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// hook
export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }

  return ctx;
}