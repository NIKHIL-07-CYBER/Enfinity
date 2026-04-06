// DONE: Task 2a — Active paragraph detection using rAF + viewport top-anchor
import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';

export interface ParagraphMeta {
  id: string;
  text: string;
  wordCount: number;
  daleChallScore: number;
}

// Height of the fixed top nav bar in px
const NAV_H = 64;

export function useActiveParagraph(paragraphs: ParagraphMeta[]): void {
  const rafRef = useRef(0);
  const lastIdRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!paragraphs || paragraphs.length === 0) return;

    const loop = () => {
      const scrollY = window.scrollY;
      const innerH = window.innerHeight;

      // Detection line = just below the nav bar + 10% of reading area
      // This ensures paragraph 1 is active when at top of page
      const detectionY = scrollY + NAV_H + (innerH - NAV_H) * 0.12;

      const elements = document.querySelectorAll('[data-paragraph-id]');
      let foundId: string | null = null;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();

        // Absolute positions in document
        const absTop = rect.top + scrollY;
        const absBottom = rect.bottom + scrollY;

        if (absTop <= detectionY && detectionY <= absBottom) {
          foundId = el.getAttribute('data-paragraph-id');
          break;
        }
      }

      // Fallback: if no paragraph straddles the detection line,
      // pick the last paragraph whose top is above the detection line
      if (!foundId && elements.length > 0) {
        for (let i = elements.length - 1; i >= 0; i--) {
          const el = elements[i] as HTMLElement;
          const rect = el.getBoundingClientRect();
          const absTop = rect.top + scrollY;
          if (absTop <= detectionY) {
            foundId = el.getAttribute('data-paragraph-id');
            break;
          }
        }
      }

      if (foundId && foundId !== lastIdRef.current) {
        lastIdRef.current = foundId;

        // Short debounce (60ms) to avoid flickering on fast scroll
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const id = foundId;
        debounceRef.current = window.setTimeout(() => {
          const current = useTelemetryStore.getState().activeParagraphId;
          if (current !== id) {
            useTelemetryStore.getState().setActiveParagraph(id);
          }
          debounceRef.current = null;
        }, 60);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paragraphs]);
}
