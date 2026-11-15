import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_KEY } from '../constants/config';
import * as api from '../lib/api';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  ready: false,

  init: async () => {
    try {
      const saved = await AsyncStorage.getItem(SESSION_KEY);
      if (saved) {
        let session;
        try { session = JSON.parse(saved); } catch { session = null; }
        if (session?.access_token && session?.refresh_token) {
          await api.activateSession(session);
          const user = await api.getMe();
          const active = await supabase.auth.getSession();
          const current = active.data?.session || session;
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(current));
          set({ user, token: current.access_token, ready: true });
          return;
        }
      }
    } catch (error) {
      await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    }
    set({ user: null, token: null, ready: true });
  },

  setSession: async ({ session, token, user }) => {
    const activeSession = session || null;
    if (activeSession) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
      set({ token: activeSession.access_token, user: user || await api.getMe() });
      return;
    }
    if (token) throw new Error('جلسة الدخول غير مكتملة. أعد تسجيل الدخول.');
  },

  setUser: (user) => set({ user }),

  signIn: async (username, password) => {
    const result = await api.login(username, password);
    await get().setSession(result);
  },

  signUp: async (username, password, displayName) => {
    const result = await api.register(username, password, displayName);
    await get().setSession(result);
  },

  clear: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ user: null, token: null });
  },

  signOut: async () => {
    try { await api.logout(); } catch (error) { /* clear local session regardless */ }
    await get().clear();
  },
}));

api.setOnSessionExpired(() => {
  useAuthStore.getState().clear();
});


supabase.auth.onAuthStateChange((event, session) => {
  if (session) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
  else if (event === 'SIGNED_OUT') AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
});
