import { useEffect, useRef } from 'react';
import { saveSession } from '../utils/persistence';

// Dummy imports for TS, simulating consumption from Dev B and Dev C stores
import { useTelemetryStore } from './useTelemetryStore';
import { useAdaptationStore } from './useAdaptationStore';

export function useSessionPersistence() {
  const { activeParagraphId } = useTelemetryStore();
  const { appliedAdaptations } = useAdaptationStore();
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        saveSession({
          lastParagraphId: activeParagraphId,
          scrollY: window.scrollY,
          appliedAdaptations
        });
      }, 5000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [activeParagraphId, appliedAdaptations]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('last_paragraph_id', activeParagraphId);
      localStorage.setItem('last_scroll_y', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeParagraphId]);
}
