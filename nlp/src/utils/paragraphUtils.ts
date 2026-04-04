import type { AdaptationEvent } from "../types";
import mockCorpus from "../data/mockCorpus.json";

// ─── Constants ────────────────────────────────────────────────────────────────

// Type that matches the Paragraph interface Dev D will likely implement
export interface Paragraph {
  id: string;
  text: string;
}

// ─── paragraphUtils ──────────────────────────────────────────────────────────

/**
 * Interface contract agreed with Dev D (Persistence specialized).
 * Until Dev D is merged, we use this bridge to mock the para repository.
 */

const paraCache: Record<string, Paragraph> = {};

// Initialize cache with mock corpus for Phase 3 E2E testing
mockCorpus.forEach((p) => {
  paraCache[p.id] = { id: p.id, text: p.text };
});

/**
 * Retrieves a paragraph's text by its ID.
 *   - Dev C uses this to find the sentence context for a struggle word.
 *   - Dev D will replace this logic with an IndexedDB lookup.
 *
 * @param id  The unique identifier for the paragraph (e.g. from telemetry)
 * @returns   The paragraph object containing text, or undefined if missing
 */
export function getParagraphById(id: string): Paragraph | undefined {
  const para = paraCache[id];
  if (!para) {
    console.warn(`[PERSISTENCE] Paragraph ID "${id}" not found in current store.`);
  }
  return para;
}

/**
 * Persists an adaptation event to the system log (IndexedDB).
 *   - Dev D will implement the actual storage logic.
 *   - Used for telemetry metrics (knowing which intervention worked).
 *
 * @param event  The AdaptationEvent emitted by Dev C
 */
export function saveAppliedAdaptation(event: AdaptationEvent): void {
  console.log(`[PERSISTENCE] Saving adaptation for ${event.paragraphId}:`, event);
  // Dev D will implement logic like:
  // db.adaptations.add(event);
}

/**
 * Helper for testing: Pre-load a paragraph into the cache.
 */
export function registerParagraph(id: string, text: string): void {
  paraCache[id] = { id, text };
}
