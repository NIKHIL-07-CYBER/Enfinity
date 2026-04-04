import { useEffect, useRef } from 'react';
import { useReadingModeStore } from '@/store/readingModeStore';
import { fetchDefinition } from '@nlp/utils/definitionFetcher';
import { fetchCognate, detectUserLanguage } from '@nlp/utils/cognateMapper';

/**
 * Manual mode: hover a word 400ms to fetch definition (no click/drag).
 */
export function useManualMode(): void {
  const mode = useReadingModeStore((s) => s.mode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastWordRef = useRef<string>('');

  useEffect(() => {
    if (mode !== 'manual') {
      lastWordRef.current = '';
      return;
    }

    const el = document.querySelector('.reading-container');
    if (!el || !(el instanceof HTMLElement)) return;

    const clearDebounce = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }
    };

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

    const onMouseMove = (e: MouseEvent) => {
      const sel = window.getSelection()?.toString()?.trim();
      if (sel && sel.length > 0) {
        useReadingModeStore.getState().setHoverWord(null, null);
        lastWordRef.current = '';
        clearDebounce();
        return;
      }

      const target = e.target as Node;
      if (!el.contains(target)) {
        const box = document.querySelector('.manual-hover-box');
        if (box && box.contains(target)) return;
      }

      if (!el.contains(target)) return;

      const extracted = extractWordAtPoint(e.clientX, e.clientY);
      if (!extracted) {
        clearDebounce();
        return;
      }

      const { word, rect } = extracted;
      const sameWord = word === lastWordRef.current;
      lastWordRef.current = word;
      useReadingModeStore.getState().setHoverWord(word, rect);

      if (sameWord) return;

      clearDebounce();
      debounceRef.current = setTimeout(async () => {
        const still = useReadingModeStore.getState().hoverWord;
        if (still !== word) return;

        useReadingModeStore.getState().setHoverFetchState({ manualHoverLoading: true });
        try {
          const def = await fetchDefinition(word);
          const lang = detectUserLanguage();
          let tr: string | null = null;
          if (lang !== 'en') {
            tr = await fetchCognate(word, lang);
          }
          useReadingModeStore.getState().setHoverFetchState({
            hoverDefinition: def,
            hoverTranslation: tr,
            manualHoverLoading: false,
          });
        } catch {
          useReadingModeStore.getState().setHoverFetchState({
            hoverDefinition: 'No definition found',
            hoverTranslation: null,
            manualHoverLoading: false,
          });
          setTimeout(() => {
            if (useReadingModeStore.getState().hoverWord === word) {
              useReadingModeStore.getState().setHoverWord(null, null);
            }
          }, 1500);
        }
      }, 400);
    };

    const onMouseLeave = () => {
      clearDebounce();
      setTimeout(() => {
        const box = document.querySelector('.manual-hover-box');
        const active = document.activeElement;
        if (box?.matches(':hover') || box?.contains(active)) return;
        useReadingModeStore.getState().setHoverWord(null, null);
        lastWordRef.current = '';
      }, 200);
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      clearDebounce();
    };
  }, [mode]);
}
