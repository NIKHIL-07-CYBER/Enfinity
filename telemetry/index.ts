// Public API for the telemetry module
// Other folders (UI/, nlp/, backend/) should import from here — not from internals.

export { useTelemetryStore } from './store/telemetryStore';
export { useConceptStore } from './store/conceptStore';
export type { CFSEvent, TelemetryState } from './store/telemetryStore';
export type { ConceptState } from './store/conceptStore';
export { calculateCFS } from './utils/cfsCalculator';
export { processParagraphExit, setGlobalRegressionRate } from './utils/telemetryPipeline';
export { extractDifficultTerms } from './utils/keywordExtractor';
export { useParagraphDwell } from './hooks/useParagraphDwell';
export { useRegressionTracker } from './hooks/useRegressionTracker';
export { useHighlightHesitation } from './hooks/useHighlightHesitation';
export { useTelemetryResume } from './hooks/useTelemetryResume';
export { TelemetryOverlay } from './components/TelemetryOverlay';
