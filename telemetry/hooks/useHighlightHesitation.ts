import { useEffect, useRef } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';

// TODO: Replace with import from nlp/utils/adaptationBus.ts when Dev C merges
const adaptationBus = {
  emit: (e: string, d: unknown) => console.log('[adaptationBus STUB]', e, d),
};

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
          const activeParagraphId =
            useTelemetryStore.getState().activeParagraphId;

          if (activeParagraphId) {
            adaptationBus.emit('triggerAdaptation', {
              paragraphId: activeParagraphId,
              cfs: 1.6,
              strugglingWord: word,
            });
            useConceptStore.getState().addStruggledTerm(word);
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
