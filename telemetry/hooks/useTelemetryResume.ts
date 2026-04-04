import { useEffect } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConceptStore } from '../store/conceptStore';
import { loadTelemetryLog, loadConceptTerms } from '../../backend/src/utils/persistence';


interface PersistedData {
  struggleLog: Record<string, number>;
  terms: string[];
}

async function loadPersistedData(): Promise<PersistedData | null> {
  try {
    const struggleLog = await loadTelemetryLog();
    const terms = await loadConceptTerms();

    return { 
      struggleLog: struggleLog || {}, 
      terms 
    };
  } catch (error) {
    console.error('[TELEMETRY] Failed to resume session:', error);
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

      // Restore struggled paragraphs (CFS > threshold) for overlay + review UI
      const STRUGGLE_CFS = 1.5;
      for (const [paragraphId, cfs] of Object.entries(struggleLog)) {
        if (cfs > STRUGGLE_CFS) {
          useConceptStore.getState().addStruggledParagraph(paragraphId);
        }
      }

      // Restore struggled terms into concept store
      if (terms.length > 0) {
        for (const term of terms) {
          useConceptStore.getState().addStruggledTerm(term);
        }
      }

      if (import.meta.env?.DEV) {
        console.log(
          '[TELEMETRY] Session resumed, loaded',
          Object.keys(struggleLog).length,
          'paragraphs',
        );
      }
    });
  }, []);
}
