// DONE: Task 4a — Settings store for adaptation toggle + brightness adapter
import { create } from 'zustand';

export interface SettingsState {
  adaptationEnabled: boolean;
  brightnessAdapterEnabled: boolean;
  toggleAdaptation: () => void;
  toggleBrightnessAdapter: () => void;
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch { /* empty */ }
  return fallback;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  adaptationEnabled: readBool('adaptation_enabled', true),
  brightnessAdapterEnabled: readBool('brightness_adapter_enabled', true),

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
}));
