import { create } from 'zustand';
import type { ReadingMode } from '@/types/ReadingMode';

const STORAGE_KEY = 'reading_mode';

function readMode(): ReadingMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'automatic' || v === 'permission' || v === 'manual') return v;
  } catch {
    /* empty */
  }
  return 'automatic';
}

export interface PermissionWordRow {
  word: string;
  definition: string;
  isAcronym: boolean;
}

interface ReadingModeState {
  mode: ReadingMode;
  setMode: (m: ReadingMode) => void;
  permissionPanelParagraphId: string | null;
  permissionPanelVisible: boolean;
  permissionPanelExpanded: boolean;
  permissionPanelWords: PermissionWordRow[];
  permissionPanelLoading: boolean;
  setPermissionPanel: (paragraphId: string | null, visible: boolean) => void;
  togglePermissionExpanded: () => void;
  setPermissionPanelWords: (rows: PermissionWordRow[]) => void;
  setPermissionPanelLoading: (v: boolean) => void;
  hoverWord: string | null;
  hoverWordRect: DOMRect | null;
  hoverDefinition: string | null;
  hoverTranslation: string | null;
  manualHoverLoading: boolean;
  setHoverWord: (word: string | null, rect: DOMRect | null) => void;
  setHoverFetchState: (partial: {
    hoverDefinition?: string | null;
    hoverTranslation?: string | null;
    manualHoverLoading?: boolean;
  }) => void;
}

export const useReadingModeStore = create<ReadingModeState>((set, get) => ({
  mode: readMode(),
  permissionPanelParagraphId: null,
  permissionPanelVisible: false,
  permissionPanelExpanded: false,
  permissionPanelWords: [],
  permissionPanelLoading: false,
  hoverWord: null,
  hoverWordRect: null,
  hoverDefinition: null,
  hoverTranslation: null,
  manualHoverLoading: false,

  setMode: (m) => {
    localStorage.setItem(STORAGE_KEY, m);
    set((s) => {
      const patch: Partial<ReadingModeState> = { mode: m };
      if (m !== 'permission') {
        patch.permissionPanelVisible = false;
        patch.permissionPanelParagraphId = null;
        patch.permissionPanelExpanded = false;
        patch.permissionPanelWords = [];
        patch.permissionPanelLoading = false;
      }
      if (m !== 'manual') {
        patch.hoverWord = null;
        patch.hoverWordRect = null;
        patch.hoverDefinition = null;
        patch.hoverTranslation = null;
        patch.manualHoverLoading = false;
      }
      return { ...s, ...patch };
    });
  },

  setPermissionPanel: (paragraphId, visible) =>
    set({
      permissionPanelParagraphId: paragraphId,
      permissionPanelVisible: visible,
      permissionPanelExpanded: visible ? false : get().permissionPanelExpanded,
      permissionPanelWords: visible ? [] : get().permissionPanelWords,
      permissionPanelLoading: visible,
    }),

  togglePermissionExpanded: () =>
    set((s) => ({ permissionPanelExpanded: !s.permissionPanelExpanded })),

  setPermissionPanelWords: (rows) => set({ permissionPanelWords: rows, permissionPanelLoading: false }),

  setPermissionPanelLoading: (v) => set({ permissionPanelLoading: v }),

  setHoverWord: (word, rect) =>
    set((s) => {
      if (!word) {
        return {
          hoverWord: null,
          hoverWordRect: null,
          hoverDefinition: null,
          hoverTranslation: null,
          manualHoverLoading: false,
        };
      }
      const same = word === s.hoverWord;
      return {
        hoverWord: word,
        hoverWordRect: rect,
        hoverDefinition: same ? s.hoverDefinition : null,
        hoverTranslation: same ? s.hoverTranslation : null,
        manualHoverLoading: same ? s.manualHoverLoading : true,
      };
    }),

  setHoverFetchState: (partial) => set(partial),
}));
