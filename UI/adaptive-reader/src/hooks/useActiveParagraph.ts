// DONE: Task 2a — Active paragraph detection using rAF, nearest-to-scanline strategy
import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';

export interface ParagraphMeta {
  id: string;
  text: string;
  wordCount: number;
  daleChallScore: number;
}

// Fixed nav bar height in px
const NAV_H = 64;

// Fraction of the READING area (below nav) where the scan line sits.
// 0.35 = upper-third of reading area → first visible element activates quickly,
// but the line is far enough down that the heading/title can be detected.
const SCAN_FRAC = 0.35;

export function useActiveParagraph(paragraphs: ParagraphMeta[]): void {
  const rafRef = useRef(0);
  const lastIdRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!paragraphs || paragraphs.length === 0) return;

    const loop = () => {
      const scrollY = window.scrollY;
      const innerH = window.innerHeight;
      const readingH = innerH - NAV_H;

      // Scan line — 35% down the reading area below the nav bar
      const scanLine = scrollY + NAV_H + readingH * SCAN_FRAC;

      // Query ALL trackable elements (paragraphs + heading if wrapped)
      const elements = document.querySelectorAll('[data-paragraph-id]');
      if (elements.length === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      let foundId: string | null = null;
      let minDist = Infinity;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();

        const absTop    = rect.top    + scrollY;
        const absBottom = rect.bottom + scrollY;
        const absCenter = (absTop + absBottom) / 2;

        // Skip elements fully off-screen
        if (rect.bottom < -400 || rect.top > innerH + 400) continue;

        if (absTop <= scanLine && scanLine <= absBottom) {
          // Scan line is INSIDE this element — exact match
          foundId = el.getAttribute('data-paragraph-id');
          break;
        }

        // Otherwise record how far the element's center is from the scan line
        const dist = Math.abs(absCenter - scanLine);
        if (dist < minDist) {
          minDist = dist;
          foundId = el.getAttribute('data-paragraph-id');
        }
      }

      if (foundId && foundId !== lastIdRef.current) {
        lastIdRef.current = foundId;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        const id = foundId;
        debounceRef.current = window.setTimeout(() => {
          const current = useTelemetryStore.getState().activeParagraphId;
          if (current !== id) {
            useTelemetryStore.getState().setActiveParagraph(id);
          }
          debounceRef.current = null;
        }, 80);
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
