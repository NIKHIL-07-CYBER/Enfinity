// ============================================================
// Type Contracts — owned by Dev C, published for all teammates
// ============================================================

/**
 * Emitted BY Dev C's adaptation engine.
 * Consumed BY Dev A's UI layer to render inline tooltips / highlights.
 */
export interface AdaptationEvent {
  /** The paragraph this adaptation targets. */
  paragraphId: string;
  /** Index of the word within paragraph.text.split(" ") — 0-based. */
  wordIndex: number;
  /** The original word as it appears in the paragraph text. */
  originalWord: string;
  /**
   * What to show the user:
   *   - "definition" → short definition string (≤ 80 chars)
   *   - "synonym"    → simpler synonym word
   *   - "cognate"    → "traduccion (es)" format
   *   - "acronym"    → full expansion, e.g. "Natural Language Processing"
   */
  replacement: string;
  /** The type of adaptation applied. */
  type: "definition" | "synonym" | "cognate" | "acronym";
  /** Confidence score 0.0–1.0. Values below 0.7 should be treated with caution. */
  confidence: number;
}

/**
 * Emitted BY Dev B's telemetry layer.
 * Consumed BY Dev C's adaptation engine via the adaptationBus.
 */
export interface TriggerAdaptationEvent {
  /** Which paragraph the user is currently struggling with. */
  paragraphId: string;
  /** Comprehension Friction Score computed by Dev B. Typical range 0.0–3.0. */
  cfs: number;
  /**
   * Optional: the specific word Dev B detected hesitation on
   * (e.g. from cursor dwell time or re-read detection).
   * If absent, Dev C picks the most difficult word automatically.
   */
  strugglingWord?: string;
}

/**
 * Represents a paragraph of content.
 * Owned by Dev D (persistence). Provided here for cross-team type sharing.
 */
export interface Paragraph {
  id: string;
  text: string;
  /** Optional metadata for ordering / display */
  index?: number;
}
