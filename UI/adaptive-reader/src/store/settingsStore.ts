// DONE: Task 4a — Settings store for adaptation toggle + brightness adapter + theme
import { create } from 'zustand';
import type { Theme } from '@/utils/themeManager';
import { applyTheme, getStoredTheme } from '@/utils/themeManager';

export interface SettingsState {
  adaptationEnabled: boolean;
  brightnessAdapterEnabled: boolean;
  theme: Theme;
  readingLanguage: string;
  toggleAdaptation: () => void;
  toggleBrightnessAdapter: () => void;
  setTheme: (t: Theme) => void;
  setReadingLanguage: (lang: string) => void;
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch {
    /* empty */
  }
  return fallback;
}

function readReadingLanguage(): string {
  try {
    const stored = localStorage.getItem('reader_settings');
    if (stored) {
      const j = JSON.parse(stored) as { defaultLanguage?: string };
      if (j.defaultLanguage) return j.defaultLanguage;
    }
  } catch {
    /* empty */
  }
  return 'es';
}

export const useSettingsStore = create<SettingsState>((set) => ({
  adaptationEnabled: readBool('adaptation_enabled', true),
  brightnessAdapterEnabled: readBool('brightness_adapter_enabled', true),
  theme: getStoredTheme(),
  readingLanguage: readReadingLanguage(),

  toggleAdaptation: () =>
    set((state) => {
      const next = !state.adaptationEnabled;
      localStorage.setItem('adaptation_enabled', String(next));
      return { adaptationEnabled: next };
    }),

  toggleBrightnessAdapter: () =>
    set((state) => {
      const next = !state.brightnessAdapterEnabled;
      localStorage.setItem('brightness_adapter_enabled', String(next));
      return { brightnessAdapterEnabled: next };
    }),

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
    try {
      const raw = localStorage.getItem('reader_settings');
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem('reader_settings', JSON.stringify({ ...prev, theme: t }));
    } catch {
      /* empty */
    }
  },

  setReadingLanguage: (lang) => {
    set({ readingLanguage: lang });
    try {
      const raw = localStorage.getItem('reader_settings');
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem('reader_settings', JSON.stringify({ ...prev, defaultLanguage: lang }));
    } catch {
      /* empty */
    }
  },
}));
