import { create } from 'zustand';

export interface CFSEvent {
  paragraphId: string;
  cfs: number;
  timestamp: number;
}

export interface TelemetryState {
  events: CFSEvent[];
  recordEvent: (event: CFSEvent) => void;
  clearEvents: () => void;
  // Additional fields used by components
  activeParagraphId?: string;
  setActiveParagraph: (id: string) => void;
  latestCFS?: { paragraphId: string; cfs: number };
  setLatestCFS: (cfs: { paragraphId: string; cfs: number }) => void;
  struggleLog: Record<string, number>;
  recordStruggle: (paragraphId: string, cfs: number) => void;
}

// Local telemetry store
export const useTelemetryStore = create<TelemetryState>((set) => ({
  events: [],
  recordEvent: (event: CFSEvent) => {
    set((state) => ({
      events: [...state.events, event],
    }));
  },
  clearEvents: () => set({ events: [] }),
  activeParagraphId: undefined,
  setActiveParagraph: (id: string) => set({ activeParagraphId: id }),
  latestCFS: undefined,
  setLatestCFS: (cfs: { paragraphId: string; cfs: number }) => set({ latestCFS: cfs }),
  struggleLog: {},
  recordStruggle: (paragraphId: string, cfs: number) => {
    set((state) => ({
      struggleLog: { ...state.struggleLog, [paragraphId]: cfs },
      latestCFS: { paragraphId, cfs },
    }));
  },
}));

