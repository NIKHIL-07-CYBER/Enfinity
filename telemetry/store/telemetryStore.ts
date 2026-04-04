import { create } from 'zustand';

export interface CFSEvent {
  paragraphId: string;
  cfs: number;
  observedWPM: number;
  regressionRate: number;
  daleChallScore: number;
}

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

  updateCFS: (event: CFSEvent) =>
    set((state) => ({
      latestCFS: event,
      struggleLog: {
        ...state.struggleLog,
        [event.paragraphId]: event.cfs,
      },
    })),

  setActiveParagraph: (id: string) =>
    set(() => ({
      activeParagraphId: id,
    })),
}));
