import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { processParagraphExit } from '../utils/telemetryPipeline';

export interface ParagraphMeta {
  id: string;
  wordCount: number;
  daleChallScore: number;
}

export function useParagraphDwell(paragraphs: ParagraphMeta[]): void {
  const entryTimes = useRef<Record<string, number>>({});
  const exitTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ---------------------------------------------------------------------------
  // Core IntersectionObserver — fires dwell-time telemetry on paragraph exit
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-paragraph-id');
          if (!id) continue;

          const paragraph = paragraphs.find((p) => p.id === id);
          if (!paragraph) continue;

          if (entry.isIntersecting) {
            // --- ENTRY: paragraph scrolled into view (≥60%) ---
            entryTimes.current[id] = Date.now();
            useTelemetryStore.getState().setActiveParagraph(id);

            // Fallback timer: if the user sits on a single paragraph for 30s
            // without scrolling past it, fire the exit calculation anyway so
            // the CFS engine still gets data for single-paragraph documents.
            exitTimers.current[id] = setTimeout(() => {
              const entryTime = entryTimes.current[id];
              if (entryTime == null) return;

              const dwellMs = Date.now() - entryTime;
              const dwellMinutes = dwellMs / 60000;
              const observedWPM =
                dwellMinutes > 0 ? paragraph.wordCount / dwellMinutes : 999;

              requestIdleCallback(
                () =>
                  processParagraphExit(
                    id,
                    observedWPM,
                    paragraph.daleChallScore,
                  ),
                { timeout: 2000 },
              );

              delete entryTimes.current[id];
            }, 30_000);
          } else {
            // --- EXIT: paragraph scrolled out of view ---
            clearTimeout(exitTimers.current[id]);
            delete exitTimers.current[id];

            const entryTime = entryTimes.current[id];
            if (entryTime == null) return;

            const dwellMs = Date.now() - entryTime;
            const dwellMinutes = dwellMs / 60000;
            const observedWPM =
              dwellMinutes > 0 ? paragraph.wordCount / dwellMinutes : 999;

            requestIdleCallback(
              () =>
                processParagraphExit(
                  id,
                  observedWPM,
                  paragraph.daleChallScore,
                ),
              { timeout: 2000 },
            );

            delete entryTimes.current[id];
          }
        }
      },
      { threshold: 0.6 },
    );

    // Observe every paragraph element on the page
    const elements = document.querySelectorAll('[data-paragraph-id]');
    elements.forEach((el) => observer.observe(el));

    // Cleanup
    return () => {
      observer.disconnect();
      for (const timerId of Object.values(exitTimers.current)) {
        clearTimeout(timerId);
      }
      exitTimers.current = {};
    };
  }, [paragraphs]);

  // ---------------------------------------------------------------------------
  // Visibility-change edge case — flush all active dwells when the tab hides
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) return;

      const now = Date.now();

      for (const [id, entryTime] of Object.entries(entryTimes.current)) {
        const paragraph = paragraphs.find((p) => p.id === id);
        if (!paragraph) continue;

        // Clear any pending fallback timer for this paragraph
        clearTimeout(exitTimers.current[id]);
        delete exitTimers.current[id];

        const dwellMs = now - entryTime;
        const dwellMinutes = dwellMs / 60000;
        const observedWPM =
          dwellMinutes > 0 ? paragraph.wordCount / dwellMinutes : 999;

        requestIdleCallback(
          () =>
            processParagraphExit(id, observedWPM, paragraph.daleChallScore),
          { timeout: 2000 },
        );
      }

      // All active entries have been flushed
      entryTimes.current = {};
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [paragraphs]);
}
