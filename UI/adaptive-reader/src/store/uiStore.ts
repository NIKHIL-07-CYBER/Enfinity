// DONE: Task 6a + Task 7a — UI store for chrome visibility, burst, focus mode, zero-chrome
import { create } from 'zustand';

export interface UIState {
  chromeVisible: boolean;
  chromeOpacity: number;
  burstActive: boolean;
  focusMode: boolean;
  summaryDrawerOpen: boolean;
  zeroChrome: boolean;
  showExitHint: boolean;
  eyeStrainVisible: boolean;
  setChromeVisible: (v: boolean) => void;
  setChromeOpacity: (v: number) => void;
  triggerBurst: () => void;
  toggleFocusMode: () => void;
  setSummaryDrawerOpen: (v: boolean) => void;
  enterZeroChrome: () => void;
  exitZeroChrome: () => void;
  setShowExitHint: (v: boolean) => void;
  toggleEyeStrain: () => void;
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
  summaryDrawerOpen: false,
  zeroChrome: false,
  showExitHint: false,
  eyeStrainVisible: false,

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
  setSummaryDrawerOpen: (v) => set({ summaryDrawerOpen: v }),

  enterZeroChrome: () => {
    // Enter fullscreen via Fullscreen API
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // Fullscreen denied — still apply zero-chrome styles
      });
    }
    document.documentElement.classList.add('zero-chrome-active');
    document.documentElement.classList.add('focus-mode-active');
    localStorage.setItem('focus_mode', 'true');
    set({ zeroChrome: true, focusMode: true, showExitHint: true });

    // Auto-hide exit hint after 2.5s
    setTimeout(() => {
      set({ showExitHint: false });
    }, 2500);
  },

  exitZeroChrome: () => {
    document.documentElement.classList.remove('zero-chrome-active');
    document.documentElement.classList.remove('focus-mode-active');
    localStorage.setItem('focus_mode', 'false');

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    set({ zeroChrome: false, focusMode: false, showExitHint: false });
  },

  setShowExitHint: (v) => set({ showExitHint: v }),

  toggleEyeStrain: () => set((state) => ({ eyeStrainVisible: !state.eyeStrainVisible })),
}));

