// DONE: Task 6a + Task 7a — UI store for chrome visibility, burst, focus mode
import { create } from 'zustand';

export interface UIState {
  chromeVisible: boolean;
  chromeOpacity: number;
  burstActive: boolean;
  focusMode: boolean;
  setChromeVisible: (v: boolean) => void;
  setChromeOpacity: (v: number) => void;
  triggerBurst: () => void;
  toggleFocusMode: () => void;
}

function readBoolLS(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch { /* empty */ }
  return fallback;
}

export const useUIStore = create<UIState>((set) => ({
  chromeVisible: true,
  chromeOpacity: 1,
  burstActive: false,
  focusMode: readBoolLS('focus_mode', false),

  setChromeVisible: (v) => set({ chromeVisible: v }),
  setChromeOpacity: (v) => set({ chromeOpacity: v }),
  triggerBurst: () => set({ burstActive: true, chromeOpacity: 1, chromeVisible: true }),
  toggleFocusMode: () =>
    set((state) => {
      const next = !state.focusMode;
      localStorage.setItem('focus_mode', String(next));
      if (next) {
        document.documentElement.classList.add('focus-mode-active');
      } else {
        document.documentElement.classList.remove('focus-mode-active');
      }
      return { focusMode: next };
    }),
}));
