// DONE: Task 3a — Selection store + Task 2a action panel state
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useDocumentStore } from './documentStore';

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
  highlightId?: string;
  folder?: string;
  note?: string;
}

export interface SelectionState {
  currentSelection: string;
  currentParagraphId: string;
  selectionRect: { top: number; left: number; width: number; height: number } | null;
  savedEntries: SelectionEntry[];
  folders: string[];
  isToolbarVisible: boolean;
  currentTranslation: string | null;
  currentDefinition: string | null;
  currentPhonetic: string | null;
  isFetchingTranslation: boolean;
  isFetchingDefinition: boolean;
  isFetchingPhonetic: boolean;
  noteContent: string;
  setCurrentSelection: (
    text: string,
    rect: { top: number; left: number; width: number; height: number } | null,
    paragraphId: string,
  ) => void;
  saveEntry: (entry: SelectionEntry) => void;
  updateEntry: (id: string, partial: Partial<SelectionEntry>) => void;
  deleteEntry: (id: string) => void;
  addFolder: (name: string) => void;
  setToolbarVisible: (v: boolean) => void;
  loadFromStorage: () => void;
  clearActionResults: () => void;
  patchActionPanel: (
    partial: Partial<
      Pick<
        SelectionState,
        | 'currentTranslation'
        | 'currentDefinition'
        | 'currentPhonetic'
        | 'isFetchingTranslation'
        | 'isFetchingDefinition'
        | 'isFetchingPhonetic'
        | 'noteContent'
      >
    >,
  ) => void;
  buildEntry: (partial: Partial<SelectionEntry>) => SelectionEntry;
}

function loadEntries(): SelectionEntry[] {
  try {
    const stored = localStorage.getItem('selection_entries');
    if (stored) return JSON.parse(stored);
  } catch {
    /* empty */
  }
  return [];
}

function loadFolders(): string[] {
  try {
    const stored = localStorage.getItem('selection_folders');
    if (stored) return JSON.parse(stored);
  } catch {
    /* empty */
  }
  return ['Unsorted'];
}

function saveEntriesToLS(entries: SelectionEntry[]) {
  localStorage.setItem('selection_entries', JSON.stringify(entries));
}

function saveFoldersToLS(folders: string[]) {
  localStorage.setItem('selection_folders', JSON.stringify(folders));
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  currentSelection: '',
  currentParagraphId: '',
  selectionRect: null,
  savedEntries: loadEntries(),
  folders: loadFolders(),
  isToolbarVisible: false,
  currentTranslation: null,
  currentDefinition: null,
  currentPhonetic: null,
  isFetchingTranslation: false,
  isFetchingDefinition: false,
  isFetchingPhonetic: false,
  noteContent: '',

  clearActionResults: () =>
    set({
      currentTranslation: null,
      currentDefinition: null,
      currentPhonetic: null,
      isFetchingTranslation: false,
      isFetchingDefinition: false,
      isFetchingPhonetic: false,
      noteContent: '',
    }),

  patchActionPanel: (partial) => set(partial),

  buildEntry: (partial) => {
    const s = get();
    const text = s.currentSelection;
    let type: SelectionEntry['type'] = 'phrase';
    if (!text.includes(' ')) type = 'word';
    else if (/[.?!]$/.test(text)) type = 'sentence';
    return {
      id: crypto.randomUUID(),
      text,
      paragraphId: s.currentParagraphId,
      timestamp: Date.now(),
      type,
      ...partial,
    };
  },

  setCurrentSelection: (text, rect, paragraphId) =>
    set({ currentSelection: text, selectionRect: rect, currentParagraphId: paragraphId }),

  saveEntry: (entry) => {
    set((state) => {
      const next = [...state.savedEntries, entry];
      saveEntriesToLS(next);
      return { savedEntries: next };
    });
    const user = useAuthStore.getState().user;
    if (user && import.meta.env.VITE_SUPABASE_URL) {
      const docId = useDocumentStore.getState().currentDocument?.id;
      void supabase.from('user_highlights').insert({
        user_id: user.id,
        document_id: docId ?? null,
        paragraph_id: entry.paragraphId,
        original_text: entry.text,
        highlight_color: entry.highlight ?? null,
        translation: entry.translation ?? null,
        definition: entry.definition ?? null,
        pronunciation: entry.pronunciation ?? null,
        note_content: entry.note ?? null,
        folder: entry.folder ?? 'Unsorted',
      });
    }
  },

  updateEntry: (id, partial) =>
    set((state) => {
      const next = state.savedEntries.map((e) => (e.id === id ? { ...e, ...partial } : e));
      saveEntriesToLS(next);
      return { savedEntries: next };
    }),

  deleteEntry: (id) =>
    set((state) => {
      const next = state.savedEntries.filter((e) => e.id !== id);
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
