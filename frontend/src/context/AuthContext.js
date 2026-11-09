import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { request } from '../api';

const STORAGE_KEY = '@peteats/session';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null); // { token, user, shop }
  const [isRestoring, setIsRestoring] = useState(true);

  const save = useCallback(async (next) => {
    setSession(next);
    try {
      if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      // Sem armazenamento local o app continua funcionando; só não lembra o login.
    }
  }, []);

  // Ao abrir o app, recupera a sessão salva e confirma com o servidor.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || 'null');
        if (stored?.token && active) {
          setSession(stored);
          try {
            const fresh = await request('/api/me', { token: stored.token });
            if (active) await save({ token: stored.token, user: fresh.user, shop: fresh.shop });
          } catch (error) {
            if (error.status === 401 && active) await save(null);
          }
        }
      } catch (_error) {
        // ignora sessão corrompida
      } finally {
        if (active) setIsRestoring(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [save]);

  const login = useCallback(
    async (username, password) => {
      const data = await request('/api/auth/login', { method: 'POST', body: { username, password } });
      await save(data);
      return data;
    },
    [save]
  );

  const register = useCallback(
    async (payload) => {
      const data = await request('/api/auth/register', { method: 'POST', body: payload });
      await save(data);
      return data;
    },
    [save]
  );

  const logout = useCallback(async () => {
    const token = session?.token;
    await save(null);
    if (token) request('/api/auth/logout', { method: 'POST', token }).catch(() => {});
  }, [save, session?.token]);

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      shop: session?.shop || null,
      isRestoring,
      login,
      register,
      logout,
    }),
    [session, isRestoring, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
