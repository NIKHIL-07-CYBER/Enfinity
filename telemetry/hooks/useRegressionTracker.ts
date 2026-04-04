import { useState, useEffect, useRef } from 'react';
import { setGlobalRegressionRate } from '../utils/telemetryPipeline';

export function useRegressionTracker(): { regressionRate: number } {
  const [regressionCount, setRegressionCount] = useState(0);
  const [totalScrolls, setTotalScrolls] = useState(0);

  const lastScrollY = useRef(
    typeof window !== 'undefined' ? window.scrollY : 0,
  );
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleScroll() {
      // Clear any pending debounce
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        const delta = window.scrollY - lastScrollY.current;

        // Noise filter: ignore micro-scrolls (< 3px)
        if (Math.abs(delta) < 3) {
          lastScrollY.current = window.scrollY;
          return;
        }

        setTotalScrolls((prev: number) => {
          const nextTotal = prev + 1;

          if (delta < 0) {
            // Scrolled up — regression
            setRegressionCount((prevReg: number) => {
              const nextReg = prevReg + 1;
              const rate = nextTotal > 0 ? nextReg / nextTotal : 0;
              setGlobalRegressionRate(rate);
              return nextReg;
            });
          } else {
            // Scrolled down — normal reading
            setRegressionCount((prevReg: number) => {
              const rate = nextTotal > 0 ? prevReg / nextTotal : 0;
              setGlobalRegressionRate(rate);
              return prevReg;
            });
          }

          return nextTotal;
        });

        lastScrollY.current = window.scrollY;
      }, 150);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const regressionRate = totalScrolls > 0 ? regressionCount / totalScrolls : 0;

  return { regressionRate };
}
