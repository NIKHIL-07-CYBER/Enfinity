import { create } from 'zustand';

export interface ConceptState {
  struggledTerms: string[];
  struggledParagraphs?: string[];
  addStruggleTerm: (term: string) => void;
  clearStruggleTerms: () => void;
}

// Local concept store
export const useConceptStore = create<ConceptState>((set) => ({
  struggledTerms: [],
  addStruggleTerm: (term: string) => {
    set((state) => ({
      struggledTerms: Array.from(new Set([...state.struggledTerms, term])),
    }));
  },
  clearStruggleTerms: () => set({ struggledTerms: [] }),
}));

