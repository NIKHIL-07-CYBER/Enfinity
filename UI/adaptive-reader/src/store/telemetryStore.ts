import { create } from 'zustand';
import type { CFSEvent } from '@/types';

export interface TelemetryState {
  latestCFS: CFSEvent | null;
  activeParagraphId: string | null;
  struggleLog: Record<string, number>;
  updateCFS: (event: CFSEvent) => void;
  setActiveParagraph: (id: string) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  latestCFS: null,
  activeParagraphId: null,
  struggleLog: {},
  updateCFS: (event) => set((state) => ({ 
    latestCFS: event,
    struggleLog: { ...state.struggleLog, [event.paragraphId]: (state.struggleLog[event.paragraphId] || 0) + 1 }
  })),
  setActiveParagraph: (id) => set({ activeParagraphId: id }),
}));
