/// <reference types="node" />
import Dexie, { type Table } from 'dexie';

// Polyfill IndexedDB for Node.js environments to prevent crash
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { indexedDB, IDBKeyRange } = require('fake-indexeddb') as typeof import('fake-indexeddb');
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
}

export interface TelemetryEvent {
  id?: number;
  paragraphId: string;
  cfs: number;
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

export interface StoredDocument {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
}

export class AdaptiveReaderDatabase extends Dexie {
  telemetry!: Table<TelemetryEvent, number>;
  adaptations!: Table<StoredAdaptation, number>;
  session!: Table<SessionState, string>;
  documents!: Table<StoredDocument, string>;

  constructor() {
    super('adaptive-reader-v1');
    this.version(1).stores({
      telemetry: '++id, paragraphId, timestamp',
      adaptations: '++id, paragraphId, originalWord, timestamp',
      session: 'id',
    });
    this.version(2).stores({
      telemetry: '++id, paragraphId, timestamp',
      adaptations: '++id, paragraphId, originalWord, timestamp',
      session: 'id',
      documents: 'id, userId, title, createdAt',
    });
  }
}

export const db = new AdaptiveReaderDatabase();
