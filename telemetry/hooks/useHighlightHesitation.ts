import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';
import { adaptationBus } from '../../nlp/src/utils/adaptationBus';
import { saveConceptTerms } from '../../backend/src/utils/persistence';

export function useHighlightHesitation(): void {
  const mouseDownTime = useRef<number>(0);

  useEffect(() => {
    function onMouseDown() {
      mouseDownTime.current = Date.now();
    }

    function onMouseUp() {
      const hesitationMs = Date.now() - mouseDownTime.current;

      const word = window.getSelection()?.toString().trim() || '';

      // Only trigger for single-word selections held for > 800ms
      if (hesitationMs > 800 && word.length > 0 && !word.includes(' ')) {
        requestIdleCallback(() => {
          try {
            const rm = localStorage.getItem('reading_mode');
            if (rm === 'permission' || rm === 'manual') return;
          } catch {
            /* ignore */
          }

          const activeParagraphId =
            useTelemetryStore.getState().activeParagraphId;

          if (activeParagraphId) {
            adaptationBus.emit('triggerAdaptation', {
              paragraphId: activeParagraphId,
              cfs: 1.6,
              strugglingWord: word,
            });
            useConceptStore.getState().addStruggledTerm(word);
            void saveConceptTerms(useConceptStore.getState().struggledTerms);
          }
        });
      }
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
}
