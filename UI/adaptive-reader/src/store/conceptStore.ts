import { create } from 'zustand';

export interface ConceptState {
  struggledTerms: string[];
  struggledParagraphs: string[];
  addStruggledTerm: (term: string) => void;
  addStruggledParagraph: (id: string) => void;
}

export const useConceptStore = create<ConceptState>((set) => ({
  struggledTerms: [],
  struggledParagraphs: [],
  addStruggledTerm: (term) => set((state) => ({ struggledTerms: [...state.struggledTerms, term] })),
  addStruggledParagraph: (id) => set((state) => ({ struggledParagraphs: [...state.struggledParagraphs, id] })),
}));
