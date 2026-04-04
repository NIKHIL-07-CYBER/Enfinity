import { useEffect } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';

// TODO: Replace localStorage reads with Dev D's loadTelemetryLog() and
// loadConceptTerms() from backend/utils/persistence.ts when they merge

interface PersistedCFSEvent {
  paragraphId: string;
  cfs: number;
  observedWPM: number;
  regressionRate: number;
  daleChallScore: number;
}

interface PersistedData {
  struggleLog: Record<string, number>;
  terms: string[];
}

async function loadPersistedData(): Promise<PersistedData | null> {
  try {
    // --- Rebuild struggle log from telemetry events ---
    const rawLog = localStorage.getItem('telemetry_log');
    const events: PersistedCFSEvent[] = rawLog ? JSON.parse(rawLog) : [];

    const struggleLog: Record<string, number> = {};
    for (const event of events) {
      // Keep only the highest CFS seen for each paragraph
      if (
        struggleLog[event.paragraphId] === undefined ||
        event.cfs > struggleLog[event.paragraphId]
      ) {
        struggleLog[event.paragraphId] = event.cfs;
      }
    }

    // --- Load concept terms ---
    const rawTerms = localStorage.getItem('concept_terms');
    const terms: string[] = rawTerms ? JSON.parse(rawTerms) : [];

    return { struggleLog, terms };
  } catch {
    // localStorage unavailable or corrupted data — start fresh
    return null;
  }
}

export function useTelemetryResume(): void {
  useEffect(() => {
    loadPersistedData().then((data) => {
      if (!data) return;

      const { struggleLog, terms } = data;

      // Restore struggle log into telemetry store
      if (Object.keys(struggleLog).length > 0) {
        useTelemetryStore.setState({ struggleLog });
      }

      // Restore struggled terms into concept store
      if (terms.length > 0) {
        for (const term of terms) {
          useConceptStore.getState().addStruggledTerm(term);
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[TELEMETRY] Session resumed, loaded',
          Object.keys(struggleLog).length,
          'paragraphs',
        );
      }
    });
  }, []);
}
