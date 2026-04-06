import { useEffect, useRef } from 'react';
import { useReadingModeStore } from '@/store/readingModeStore';
import { fetchDefinition } from '@nlp/utils/definitionFetcher';
import { fetchCognate, detectUserLanguage } from '@nlp/utils/cognateMapper';

/**
 * Manual mode: click on a word to see its definition and acronym info.
 * No hover — only triggered when user selects/clicks a single word.
 */
export function useManualMode(): void {
  const mode = useReadingModeStore((s) => s.mode);
  const lastWordRef = useRef<string>('');

  useEffect(() => {
    if (mode !== 'manual') {
      lastWordRef.current = '';
      useReadingModeStore.getState().setHoverWord(null, null);
      return;
    }

    const el = document.querySelector('.reading-container');
    if (!el || !(el instanceof HTMLElement)) return;

    const extractWordAtPoint = (
      clientX: number,
      clientY: number,
    ): { word: string; rect: DOMRect } | null => {
      const fn = document.caretRangeFromPoint?.bind(document);
      if (!fn) return null;
      try {
        const range = fn(clientX, clientY);
        if (!range) return null;
        const r = range as Range & { expand?: (unit: string) => void };
        r.expand?.('word');
        const word = range.toString().trim().replace(/[^a-zA-Z]/g, '');
        if (word.length < 3) return null;
        const rect = range.getBoundingClientRect();
        return { word, rect };
      } catch {
        return null;
      }
    };

    const onClick = async (e: MouseEvent) => {
      // Only handle single-word clicks — ignore if user has a multi-word selection
      const sel = window.getSelection()?.toString()?.trim();
      if (sel && sel.includes(' ')) {
        // Multi-word selection — clear manual hover
        useReadingModeStore.getState().setHoverWord(null, null);
        lastWordRef.current = '';
        return;
      }

      const target = e.target as Node;
      if (!el.contains(target)) {
        // Click outside reading container — hide the box
        useReadingModeStore.getState().setHoverWord(null, null);
        lastWordRef.current = '';
        return;
      }

      const extracted = extractWordAtPoint(e.clientX, e.clientY);
      if (!extracted) {
        useReadingModeStore.getState().setHoverWord(null, null);
        lastWordRef.current = '';
        return;
      }

      const { word, rect } = extracted;

      // Toggle off if clicking the same word again
      if (word === lastWordRef.current) {
        useReadingModeStore.getState().setHoverWord(null, null);
        lastWordRef.current = '';
        return;
      }

      lastWordRef.current = word;
      useReadingModeStore.getState().setHoverWord(word, rect);
      useReadingModeStore.getState().setHoverFetchState({ manualHoverLoading: true });

      try {
        const def = await fetchDefinition(word);
        const lang = detectUserLanguage();
        let tr: string | null = null;
        if (lang !== 'en') {
          tr = await fetchCognate(word, lang);
        }
        // Only update if the word hasn't changed while fetching
        if (useReadingModeStore.getState().hoverWord === word) {
          useReadingModeStore.getState().setHoverFetchState({
            hoverDefinition: def,
            hoverTranslation: tr,
            manualHoverLoading: false,
          });
        }
      } catch {
        if (useReadingModeStore.getState().hoverWord === word) {
          useReadingModeStore.getState().setHoverFetchState({
            hoverDefinition: 'No definition found',
            hoverTranslation: null,
            manualHoverLoading: false,
          });
        }
      }
    };

    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      useReadingModeStore.getState().setHoverWord(null, null);
      lastWordRef.current = '';
    };
  }, [mode]);
}
