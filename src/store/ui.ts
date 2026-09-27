import { create } from 'zustand';
import type { AchievementId } from '@/content/achievements';
import type { MoodLevel } from '@/content/journal';
import { uid } from '@/lib/utils';

export interface Toast {
  id: string;
  text: string;
  tone?: 'default' | 'success';
}

interface UIState {
  toasts: Toast[];
  celebration: AchievementId[];
  checkInOpen: boolean;
  checkInLevel: MoodLevel | null;
  /** The sound mixer is on screen with its own controls for the playing mix. */
  mixerOnScreen: boolean;
  /** A breathing exercise or a silent timer is running. */
  practicing: boolean;
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
  celebrate: (ids: AchievementId[]) => void;
  clearCelebration: () => void;
  openCheckIn: (open: boolean, level?: MoodLevel) => void;
  setPracticing: (on: boolean) => void;
}

export const useUI = create<UIState>()((set, get) => ({
  toasts: [],
  celebration: [],
  checkInOpen: false,
  checkInLevel: null,
  mixerOnScreen: false,
  practicing: false,
  toast: (text, tone = 'default') => {
    const t = { id: uid(), text, tone };
    set({ toasts: [...get().toasts.slice(-2), t] });
    setTimeout(() => get().dismissToast(t.id), 3200);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  celebrate: (ids) => set({ celebration: [...get().celebration, ...ids] }),
  clearCelebration: () => set({ celebration: [] }),
  openCheckIn: (open, level) => set({ checkInOpen: open, checkInLevel: open ? (level ?? null) : get().checkInLevel }),
  setPracticing: (on) => set({ practicing: on }),
}));
