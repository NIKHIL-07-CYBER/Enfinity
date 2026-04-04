import { calculateCFS } from './cfsCalculator';
import { useTelemetryStore, type CFSEvent } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';
import { adaptationBus } from '../../nlp/src/utils/adaptationBus';
import {
  saveTelemetryEvent,
  saveConceptTerms,
} from '../../backend/src/utils/persistence';
import { extractDifficultTerms } from './keywordExtractor';

// ---------------------------------------------------------------------------
// Window type extension for global regression rate
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    __regressionRate?: number;
  }
}

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Main pipeline function — called inside requestIdleCallback, never on main
// ---------------------------------------------------------------------------
export function processParagraphExit(
  paragraphId: string,
  observedWPM: number,
  daleChallScore: number,
  paragraphText?: string,
): void {
  // Guard: extremely high WPM means the user is skimming, not reading
  if (observedWPM > 600) {
    return;
  }

  // Read the current regression rate from the global window property
  const regressionRate = window.__regressionRate ?? 0;

  // Compute CFS
  const cfs = calculateCFS({
    daleChallScore,
    targetWPM: 150,
    observedWPM,
    regressionRate,
  });

  // Build the event object
  const event: CFSEvent = {
    paragraphId,
    cfs,
    observedWPM,
    regressionRate,
    daleChallScore,
  };

  // Persist to Zustand store
  useTelemetryStore.getState().updateCFS(event);

  // Fire-and-forget persistence (no await)
  saveTelemetryEvent(event);

  // If CFS exceeds the struggle threshold, flag the paragraph and trigger adaptation
  if (cfs > 1.5) {
    useConceptStore.getState().addStruggledParagraph(paragraphId);

    if (paragraphText) {
      const terms = extractDifficultTerms(paragraphText);
      terms.forEach((t) => useConceptStore.getState().addStruggledTerm(t));
      void saveConceptTerms(useConceptStore.getState().struggledTerms);
    }

    adaptationBus.emit('triggerAdaptation', { paragraphId, cfs });
  }
}

// ---------------------------------------------------------------------------
// Global regression-rate setter (called by useRegressionTracker hook)
// ---------------------------------------------------------------------------
export function setGlobalRegressionRate(rate: number): void {
  window.__regressionRate = rate;
}
