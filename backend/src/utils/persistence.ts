import { db, SessionState, TelemetryEvent, StoredAdaptation } from '../db/database';
import { CFSEvent, AdaptationEvent } from '../types';

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
    timestamp: Date.now()
  });
}

export async function loadTelemetryLog(): Promise<TelemetryEvent[]> {
  return await db.telemetry.toArray();
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
