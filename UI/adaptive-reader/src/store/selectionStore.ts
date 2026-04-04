// DONE: Task 3a — Selection store
import { create } from 'zustand';

export interface SelectionEntry {
  id: string;
  text: string;
  paragraphId: string;
  timestamp: number;
  type: 'word' | 'phrase' | 'sentence';
  translation?: string;
  definition?: string;
  pronunciation?: string;
  highlight?: string;
  folder?: string;
}

export interface SelectionState {
  currentSelection: string;
  currentParagraphId: string;
  selectionRect: { top: number; left: number; width: number; height: number } | null;
  savedEntries: SelectionEntry[];
  folders: string[];
  isToolbarVisible: boolean;
  setCurrentSelection: (text: string, rect: { top: number; left: number; width: number; height: number } | null, paragraphId: string) => void;
  saveEntry: (entry: SelectionEntry) => void;
  updateEntry: (id: string, partial: Partial<SelectionEntry>) => void;
  deleteEntry: (id: string) => void;
  addFolder: (name: string) => void;
  setToolbarVisible: (v: boolean) => void;
  loadFromStorage: () => void;
}

function loadEntries(): SelectionEntry[] {
  try {
    const stored = localStorage.getItem('selection_entries');
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return [];
}

function loadFolders(): string[] {
  try {
    const stored = localStorage.getItem('selection_folders');
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  return ['Unsorted'];
}

function saveEntriesToLS(entries: SelectionEntry[]) {
  localStorage.setItem('selection_entries', JSON.stringify(entries));
}

function saveFoldersToLS(folders: string[]) {
  localStorage.setItem('selection_folders', JSON.stringify(folders));
}

export const useSelectionStore = create<SelectionState>((set) => ({
  currentSelection: '',
  currentParagraphId: '',
  selectionRect: null,
  savedEntries: loadEntries(),
  folders: loadFolders(),
  isToolbarVisible: false,

  setCurrentSelection: (text, rect, paragraphId) =>
    set({ currentSelection: text, selectionRect: rect, currentParagraphId: paragraphId }),

  saveEntry: (entry) =>
    set((state) => {
      const next = [...state.savedEntries, entry];
      saveEntriesToLS(next);
      return { savedEntries: next };
    }),

  updateEntry: (id, partial) =>
    set((state) => {
      const next = state.savedEntries.map(e => e.id === id ? { ...e, ...partial } : e);
      saveEntriesToLS(next);
      return { savedEntries: next };
    }),

  deleteEntry: (id) =>
    set((state) => {
      const next = state.savedEntries.filter(e => e.id !== id);
      saveEntriesToLS(next);
      return { savedEntries: next };
    }),

  addFolder: (name) =>
    set((state) => {
      if (state.folders.includes(name)) return state;
      const next = [...state.folders, name];
      saveFoldersToLS(next);
      return { folders: next };
    }),

  setToolbarVisible: (v) => set({ isToolbarVisible: v }),

  loadFromStorage: () =>
    set({ savedEntries: loadEntries(), folders: loadFolders() }),
}));
