import { create } from 'zustand';
import { signMedia } from '../lib/api';

// روابط التسليم من Cloudinary صالحة لخمس دقائق؛ نعيد طلبها قبل انتهاء الصلاحية.
const TTL = 4 * 60 * 1000;

export const useMediaStore = create((set, get) => ({
  thumb: {},
  full: {},
  ensure: async (ids, variant = 'thumb') => {
    const cache = get()[variant] || {};
    const now = Date.now();
    const need = [...new Set(ids || [])].filter((id) => !cache[id] || now - cache[id].at > TTL);
    if (!need.length) return;
    for (let i = 0; i < need.length; i += 8) {
      const chunk = need.slice(i, i + 8);
      const { urls } = await signMedia(chunk);
      set((state) => {
        const next = { ...state[variant] };
        Object.entries(urls || {}).forEach(([id, url]) => { next[id] = { url, at: Date.now() }; });
        return { [variant]: next };
      });
    }
  },
  clear: () => set({ thumb: {}, full: {} }),
}));
