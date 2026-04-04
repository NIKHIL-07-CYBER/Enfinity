import { db } from '../db/database';
import type { SessionState, StoredAdaptation } from '../db/database';
import type { CFSEvent, AdaptationEvent } from '../types';

export async function saveSession(state: any): Promise<void> {
  const sessionData: SessionState = { id: 'current', ...state };
  await db.session.put(sessionData);
}

export async function loadSession(): Promise<SessionState | undefined> {
  return await db.session.get('current');
}

export async function saveTelemetryEvent(event: CFSEvent): Promise<void> {
  await db.telemetry.add({
    paragraphId: event.paragraphId,
    cfs: event.cfs,
    timestamp: Date.now()
  });
}

export async function loadTelemetryLog(): Promise<Record<string, number> | null> {
  const events = await db.telemetry.toArray();
  if (events.length === 0) return null;

  const struggleLog: Record<string, number> = {};
  for (const event of events) {
    if (
      struggleLog[event.paragraphId] === undefined ||
      event.cfs > struggleLog[event.paragraphId]
    ) {
      struggleLog[event.paragraphId] = event.cfs;
    }
  }
  return struggleLog;
}

export async function saveConceptTerms(terms: string[]): Promise<void> {
  await db.session.put({ id: 'concept_terms', terms });
}

export async function loadConceptTerms(): Promise<string[]> {
  const data = await db.session.get('concept_terms');
  return data?.terms || [];
}

export async function saveAppliedAdaptation(event: AdaptationEvent): Promise<void> {
  await db.adaptations.add({
    paragraphId: event.paragraphId,
    originalWord: event.originalWord,
    timestamp: Date.now()
  });
}

export async function loadAppliedAdaptations(): Promise<StoredAdaptation[]> {
  return await db.adaptations.toArray();
}

export async function resetAllData(): Promise<void> {
  // Clear Dexie db instances successfully
  await Promise.all([
    db.session.clear(),
    db.telemetry.clear(),
    db.adaptations.clear()
  ]);
  
  // Clear synchronous localStorage payloads securely
  if (typeof window !== 'undefined') {
    localStorage.removeItem('last_paragraph_id');
    localStorage.removeItem('last_scroll_y');
  }
}
