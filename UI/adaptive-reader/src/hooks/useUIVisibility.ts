// DONE: Task 6b — UI visibility hook for scroll fade + click-to-burst
import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';

export function useUIVisibility(): void {
  const scrollTimeoutRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const wasIdleRef = useRef(true);

  useEffect(() => {
    const focusMode = useUIStore.getState().focusMode;
    if (focusMode) return;

    const handleScroll = () => {
      if (!isScrollingRef.current && wasIdleRef.current) {
        // First scroll after idle > 800ms => start fading
        useUIStore.getState().setChromeOpacity(0);
        isScrollingRef.current = true;
        wasIdleRef.current = false;
      }

      // Reset scroll-stopped timer
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        // Scroll stopped (300ms idle) — do NOT auto-restore
        isScrollingRef.current = false;

        // Start idle timer (800ms before next scroll is considered "first scroll after idle")
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = window.setTimeout(() => {
          wasIdleRef.current = true;
        }, 800);
      }, 300);
    };

    const handleClick = (e: MouseEvent) => {
      const { focusMode, chromeOpacity } = useUIStore.getState();
      if (focusMode) return;
      if (chromeOpacity >= 0.5) return;

      const target = e.target as HTMLElement;

      // Excluded zones
      if (
        target.closest('.selection-toolbar') ||
        target.closest('.chatbot-avatar') ||
        target.closest('.chatbot-panel') ||
        target.closest('.active-paragraph-box') ||
        target.closest('.focus-mode-button') ||
        target.tagName === 'MARK'
      ) return;

      // Trigger burst
      useUIStore.getState().triggerBurst();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);
}
