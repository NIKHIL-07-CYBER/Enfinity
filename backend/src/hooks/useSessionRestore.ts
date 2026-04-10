import { useEffect, useState } from 'react';
import { loadSession } from '../utils/persistence';

/**
 * Waits for a DOM element matching the selector to appear, using rAF polling.
 * Resolves with the element, or null after `maxWaitMs` expires.
 */
function waitForElement(selector: string, maxWaitMs = 500): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    function poll() {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (performance.now() - start > maxWaitMs) return resolve(null);
      requestAnimationFrame(poll);
    }
    // Kick off after one frame to let React flush
    requestAnimationFrame(poll);
  });
}

export function useSessionRestore(paragraphsLoaded: boolean) {
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!paragraphsLoaded || restored) return;

    const restore = async () => {
      try {
        // Multi-Layer Recovery: check IndexedDB first, fallback to localStorage
        let savedId = localStorage.getItem('last_paragraph_id');
        let savedScrollY = localStorage.getItem('last_scroll_y') ? Number(localStorage.getItem('last_scroll_y')) : 0;

        const session = await loadSession();
        if (session && session.lastParagraphId) {
          savedId = session.lastParagraphId;
          savedScrollY = session.scrollY || savedScrollY;
        }

        // Precision Scrolling — wait for DOM element to appear (rAF polling, 500ms max)
        if (savedId) {
          const el = await waitForElement(`[data-paragraph-id="${savedId}"]`, 500);
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
          } else if (savedScrollY > 0) {
            window.scrollTo({ top: savedScrollY, behavior: 'instant' });
          }
        }
        setRestored(true);
      } catch (e) {
        console.error('Failed to restore session', e);
        setRestored(true);
      }
    };

    restore();
  }, [paragraphsLoaded, restored]);

  return restored;
}
