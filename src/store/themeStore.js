import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS_DARK, COLORS_LIGHT, THEME_KEY } from '../constants/config';

export const useThemeStore = create((set, get) => ({
  mode: 'light',
  load: async () => {
    try {
      const m = await AsyncStorage.getItem(THEME_KEY);
      if (m === 'light' || m === 'dark') set({ mode: m });
    } catch (e) {
      // نبقى على الافتراضي
    }
  },
  toggle: async () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: next });
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch (e) {
      // لا شيء
    }
  },
}));

export function useColors() {
  const mode = useThemeStore((s) => s.mode);
  return mode === 'dark' ? COLORS_DARK : COLORS_LIGHT;
}
