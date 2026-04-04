import { create } from 'zustand';
import type { Paragraph } from '@/types';

export interface SessionStore {
  sessionStartTime: number | null;
  setSessionStartTime: (t: number) => void;
  paragraphs: Paragraph[];
  setParagraphs: (p: Paragraph[]) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionStartTime: null,
  setSessionStartTime: (t) => set({ sessionStartTime: t }),
  paragraphs: [],
  setParagraphs: (p) => set({ paragraphs: p }),
}));
