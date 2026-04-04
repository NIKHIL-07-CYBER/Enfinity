import Dexie, { Table } from 'dexie';

// Polyfill IndexedDB for Node.js environments to prevent crash
if (typeof window === 'undefined') {
  const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
}

export interface TelemetryEvent {
  id?: number;
  paragraphId: string;
  timestamp: number;
}

export interface StoredAdaptation {
  id?: number;
  paragraphId: string;
  originalWord: string;
  timestamp: number;
}

export interface SessionState {
  id: string; // Used as a singleton e.g., 'current'
  [key: string]: any;
}

export class AdaptiveReaderDatabase extends Dexie {
  telemetry!: Table<TelemetryEvent, number>;
  adaptations!: Table<StoredAdaptation, number>;
  session!: Table<SessionState, string>;

  constructor() {
    super('adaptive-reader-v1');
    this.version(1).stores({
      telemetry: '++id, paragraphId, timestamp',
      adaptations: '++id, paragraphId, originalWord, timestamp',
      session: 'id'
    });
  }
}

export const db = new AdaptiveReaderDatabase();
