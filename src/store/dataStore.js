import { create } from 'zustand';
import * as api from '../lib/api';

export const useDataStore = create((set) => ({
  unread: 0,
  refreshUnread: async () => {
    try {
      const n = await api.unreadCount();
      set({ unread: n });
    } catch (e) {
      // صامت: الشارة فقط
    }
  },
  setUnread: (n) => set({ unread: n }),
}));
