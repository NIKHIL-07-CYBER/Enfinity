// Local persistence utilities using localStorage

export function saveSession(data: unknown): Promise<void> {
  return Promise.resolve().then(() => {
    try {
      localStorage.setItem('session_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save session:', e);
      throw e;
    }
  });
}

export function loadSession(key?: string): Promise<Record<string, unknown> | null> {
  return Promise.resolve().then(() => {
    try {
      const data = localStorage.getItem(key ? `session_${key}` : 'session_data');
      return data ? (JSON.parse(data) as Record<string, unknown>) : null;
    } catch (e) {
      console.error('Failed to load session:', e);
      return null;
    }
  });
}

export function saveTelemetryEvent(event: unknown): void {
  try {
    const events = loadTelemetryLog() as unknown[];
    localStorage.setItem('telemetry_log', JSON.stringify([...events, event]));
  } catch (e) {
    console.error('Failed to save telemetry:', e);
  }
}

export function loadTelemetryLog(): unknown {
  try {
    const data = localStorage.getItem('telemetry_log');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load telemetry:', e);
    return [];
  }
}

export function saveConceptTerms(terms: string[]): void {
  try {
    localStorage.setItem('concept_terms', JSON.stringify(terms));
  } catch (e) {
    console.error('Failed to save concept terms:', e);
  }
}

export function loadConceptTerms(): string[] {
  try {
    const data = localStorage.getItem('concept_terms');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load concept terms:', e);
    return [];
  }
}

export function saveAppliedAdaptation(adaptation: unknown): void {
  try {
    const adaptations = loadAppliedAdaptations();
    localStorage.setItem('applied_adaptations', JSON.stringify([...adaptations, adaptation]));
  } catch (e) {
    console.error('Failed to save adaptation:', e);
  }
}

export function loadAppliedAdaptations(): unknown[] {
  try {
    const data = localStorage.getItem('applied_adaptations');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load adaptations:', e);
    return [];
  }
}

export function resetAllData(): void {
  try {
    localStorage.removeItem('session_data');
    localStorage.removeItem('telemetry_log');
    localStorage.removeItem('concept_terms');
    localStorage.removeItem('applied_adaptations');
  } catch (e) {
    console.error('Failed to reset data:', e);
  }
}

