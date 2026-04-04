// DONE: Task 2a — Active paragraph detection using rAF + viewport center
import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';

export interface ParagraphMeta {
  id: string;
  text: string;
  wordCount: number;
  daleChallScore: number;
}

export function useActiveParagraph(paragraphs: ParagraphMeta[]): void {
  const pendingIdRef = useRef<string | null>(null);
  const stableTimerRef = useRef<number | null>(null);
  const cachedCountRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!paragraphs || paragraphs.length === 0) return;

    const loop = () => {
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight;
      const viewportCenter = scrollY + innerHeight * 0.45;

      const elements = document.querySelectorAll('[data-paragraph-id]');

      // Refresh cache count lazily
      if (elements.length !== cachedCountRef.current) {
        cachedCountRef.current = elements.length;
      }

      let foundId: string | null = null;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();

        // Skip off-screen elements
        if (rect.bottom < -200 || rect.top > innerHeight + 200) continue;

        const absTop = rect.top + scrollY;
        const absBottom = rect.bottom + scrollY;

        if (absTop <= viewportCenter && viewportCenter <= absBottom) {
          foundId = el.getAttribute('data-paragraph-id');
          break;
        }
      }

      if (foundId && foundId !== pendingIdRef.current) {
        pendingIdRef.current = foundId;

        // Debounce: only update after 150ms of stability
        if (stableTimerRef.current) {
          clearTimeout(stableTimerRef.current);
        }

        const idToSet = foundId;
        stableTimerRef.current = window.setTimeout(() => {
          const current = useTelemetryStore.getState().activeParagraphId;
          if (current !== idToSet) {
            useTelemetryStore.getState().setActiveParagraph(idToSet);
          }
          stableTimerRef.current = null;
        }, 150);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
      }
    };
  }, [paragraphs]);
}
