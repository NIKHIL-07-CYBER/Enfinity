import type { SessionState, CFSEvent, AdaptationEvent } from '@/types';

export async function saveSession(state: SessionState): Promise<void> {}
export async function loadSession(): Promise<SessionState | null> { return null; }
export async function saveTelemetryEvent(event: CFSEvent): Promise<void> {}
export async function loadTelemetryLog(): Promise<Record<string,number> | null> { return null; }
export async function saveAppliedAdaptation(event: AdaptationEvent): Promise<void> {}
export async function loadAppliedAdaptations(): Promise<AdaptationEvent[]> { return []; }
