import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { supabase } from '../supabaseClient';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  // Ref para evitar setState após unmount do componente (memory leak)
  const mountedRef = useRef(true);

  const _persistSession = useCallback((userData, token) => {
    sessionStorage.setItem('@TheBurguer:user', JSON.stringify(userData));
    sessionStorage.setItem('@TheBurguer:token', token);
    setUser(userData);
  }, []);

  const updateUser = useCallback((userData) => {
    const token = sessionStorage.getItem('@TheBurguer:token');
    if (token) {
      _persistSession(userData, token);
    }
  }, [_persistSession]);

  useEffect(() => {
    mountedRef.current = true;

    // 1. Checa sessão local (token JWT próprio)
    try {
      const storedUser  = sessionStorage.getItem('@TheBurguer:user');
      const storedToken = sessionStorage.getItem('@TheBurguer:token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      sessionStorage.removeItem('@TheBurguer:user');
      sessionStorage.removeItem('@TheBurguer:token');
    } finally {
      if (mountedRef.current) setLoading(false);
    }

    // 2. Listener do Supabase Auth para OAuth (Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && session) {
        const storedToken = sessionStorage.getItem('@TheBurguer:token');
        // Só aciona o backend se não já tivermos um token próprio válido
        if (!storedToken) {
          try {
            const { data } = await api.post('/auth/social', {
              token: session.access_token,
              provider: 'google',
            });
            if (mountedRef.current) {
              _persistSession(data.user, data.access_token);
            }
          } catch (err) {
            console.error('Erro no login social:', err);
          }
        }
      }

      if (mountedRef.current) setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [_persistSession]);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      _persistSession(data.user, data.access_token);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Erro ao conectar com o servidor.';
      return { success: false, message: Array.isArray(message) ? message.join(', ') : message };
    }
  }, [_persistSession]);

  const signUp = useCallback(async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      _persistSession(data.user, data.access_token);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Erro ao conectar com o servidor.';
      return { success: false, message: Array.isArray(message) ? message.join(', ') : message };
    }
  }, [_persistSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('@TheBurguer:user');
    sessionStorage.removeItem('@TheBurguer:token');
    setUser(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) return { success: false, message: error.message };
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signUp, signOut, signInWithGoogle, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
