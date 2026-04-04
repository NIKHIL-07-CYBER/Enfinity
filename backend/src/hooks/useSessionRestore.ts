import { useEffect, useState } from 'react';
import { loadSession } from '../utils/persistence';

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

        // Precision Scrolling Setup
        if (savedId) {
          const el = document.querySelector(`[data-paragraph-id="${savedId}"]`);
          if (el) {
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'instant', block: 'start' });
            }, 150);
          } else if (savedScrollY > 0) {
            setTimeout(() => {
              window.scrollTo({ top: savedScrollY, behavior: 'instant' });
            }, 150);
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
