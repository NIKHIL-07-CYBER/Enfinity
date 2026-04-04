import { create } from 'zustand';

export interface ConceptState {
  struggledTerms: string[];
  struggledParagraphs: string[];
  addStruggledTerm: (term: string) => void;
  addStruggledParagraph: (paragraphId: string) => void;
}

export const useConceptStore = create<ConceptState>((set) => ({
  struggledTerms: [],
  struggledParagraphs: [],

  addStruggledTerm: (term: string) =>
    set((state) => ({
      struggledTerms: [...new Set([...state.struggledTerms, term])],
    })),

  addStruggledParagraph: (paragraphId: string) =>
    set((state) => ({
      struggledParagraphs: [...new Set([...state.struggledParagraphs, paragraphId])],
    })),
}));
