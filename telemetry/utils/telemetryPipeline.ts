// TODO: Replace adaptationBus stub with import from nlp/utils/adaptationBus.ts when Dev C merges
// TODO: Replace saveTelemetryEvent stub with import from backend/utils/persistence.ts when Dev D merges

import { calculateCFS } from './cfsCalculator';
import { useTelemetryStore, type CFSEvent } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';

// ---------------------------------------------------------------------------
// Window type extension for global regression rate
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    __regressionRate?: number;
  }
}

// ---------------------------------------------------------------------------
// STUB: adaptationBus  (replaced when Dev C merges)
// ---------------------------------------------------------------------------
const adaptationBus = {
  emit: (event: string, data: unknown) => {
    if (import.meta.env?.DEV) {
      console.log('[adaptationBus STUB]', event, data);
    }
  },
};

// ---------------------------------------------------------------------------
// STUB: saveTelemetryEvent  (replaced when Dev D merges)
// ---------------------------------------------------------------------------
async function saveTelemetryEvent(event: CFSEvent): Promise<void> {
  try {
    const existing = JSON.parse(localStorage.getItem('telemetry_log') || '[]');
    existing.push(event);
    localStorage.setItem('telemetry_log', JSON.stringify(existing));
  } catch {
    // localStorage unavailable, silently skip
  }
}

// ---------------------------------------------------------------------------
// Main pipeline function — called inside requestIdleCallback, never on main
// ---------------------------------------------------------------------------
export function processParagraphExit(
  paragraphId: string,
  observedWPM: number,
  daleChallScore: number,
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
    adaptationBus.emit('triggerAdaptation', { paragraphId, cfs });
  }
}

// ---------------------------------------------------------------------------
// Global regression-rate setter (called by useRegressionTracker hook)
// ---------------------------------------------------------------------------
export function setGlobalRegressionRate(rate: number): void {
  window.__regressionRate = rate;
}
