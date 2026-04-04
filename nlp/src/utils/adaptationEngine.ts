import { adaptationBus } from "./adaptationBus";
import { getDifficultWords } from "./nlpUtils";
import type { TriggerAdaptationEvent, AdaptationEvent } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * CFS threshold above which adaptation fires.
 * Tuned in Phase 3 (Hour 16) against easy / medium / hard passages.
 * Default: 1.5 — increase to 1.8 if too aggressive, decrease to 1.3 if too quiet.
 */
const CFS_THRESHOLD = 1.5;

// ─── Session-scoped state ─────────────────────────────────────────────────────

/**
 * Tracks per-word stall count this session.
 *   Key: word string (lowercase)
 *   Value: number of times a TriggerAdaptationEvent specified this word
 *
 * Threshold of 3 stalls → activates ESL cognate mode.
 * Rationale: 1 stall = normal pause, 2 = mild confusion, 3 = genuine struggle.
 */
const stallCounts: Record<string, number> = {};

/**
 * Tracks adaptations already emitted this session.
 *   Key: `${paragraphId}:${word}` compound key
 *
 * Prevents double-adapting the same word in the same paragraph.
 * Different paragraph with same word CAN be adapted again.
 * Resets on session refresh (Dev D handles restoration from IndexedDB).
 */
const adaptedWords = new Set<string>();

// ─── emitAdaptation (internal helper) ────────────────────────────────────────

/**
 * Centralised emission of AdaptationEvents.
 * Calculates wordIndex from paragraph text, validates it exists,
 * then emits to Dev A via adaptationBus.
 *
 * Also calls saveAppliedAdaptation (Dev D) — uncomment when Dev D is merged.
 *
 * @returns true if emitted successfully, false if word not found in text
 */
function emitAdaptation(
  paragraphId: string,
  paragraphText: string,
  originalWord: string,
  replacement: string,
  type: AdaptationEvent["type"],
  confidence = 0.9
): boolean {
  const words = paragraphText.split(" ");
  const wordIndex = words.findIndex(
    (w) => w.toLowerCase().replace(/[^a-z]/g, "") === originalWord.toLowerCase()
  );

  if (wordIndex === -1) {
    console.warn(
      `[ADAPTATION] Word "${originalWord}" not found in paragraph ${paragraphId}`
    );
    return false;
  }

  const event: AdaptationEvent = {
    paragraphId,
    wordIndex,
    originalWord,
    replacement,
    type,
    confidence,
  };

  adaptationBus.emit("adaptation", event);
  // saveAppliedAdaptation(event); // ← uncomment when Dev D's persistence.ts is merged
  console.log("[ADAPTATION] Emitted:", event);
  return true;
}

// ─── Stub paragraph getter (Phase 1 — replaced in Phase 3) ───────────────────

/**
 * Temporary stub until Dev D's getParagraphById is available.
 * Returns undefined so the engine gracefully skips.
 * Replace in Step 3.2 with:
 *   import { getParagraphById } from "./paragraphUtils";
 */
function getStubParagraph(
  id: string
): { id: string; text: string } | undefined {
  console.warn(
    "[ADAPTATION] Using stub paragraph — replace with Dev D's getParagraphById"
  );
  return undefined;
}

// ─── triggerAdaptation handler (Phase 1 stub) ─────────────────────────────────

/**
 * Phase 1 stub — logs only. Full decision tree added in Phase 2, Step 2.5.
 *
 * Full decision tree (Phase 2+):
 *   1. CFS below threshold → skip
 *   2. Specific struggling word → definition for that word
 *   3. Acronym detected → expand it
 *   4. ESL mode + stall ≥ 3 → cognate swap
 *   5. Default → definition of most difficult word
 */
adaptationBus.on("triggerAdaptation", (event: TriggerAdaptationEvent) => {
  const { paragraphId, cfs, strugglingWord } = event;

  console.log(
    `[ADAPTATION] Triggered — paragraph: ${paragraphId} | CFS: ${cfs.toFixed(2)} | word: ${strugglingWord ?? "auto"}`
  );

  // Phase 1: bail out here. Full logic added in Phase 2.
  if (cfs < CFS_THRESHOLD) {
    console.log(`[ADAPTATION] CFS ${cfs.toFixed(2)} below threshold ${CFS_THRESHOLD} — skipping`);
    return;
  }

  // Get paragraph text (stub for Phase 1)
  const paragraph = getStubParagraph(paragraphId);
  if (!paragraph) {
    console.warn("[ADAPTATION] No paragraph found — skipping (Phase 1 stub)");
    return;
  }

  // Log difficult words for verification
  const difficult = getDifficultWords(paragraph.text);
  console.log("[ADAPTATION] Difficult words in paragraph:", difficult);
});

// ─── LibreTranslate warm-up ───────────────────────────────────────────────────

/**
 * Pre-warms the LibreTranslate proxy on startup so the first cognate
 * request doesn't incur cold-start latency during the demo.
 * Silently no-ops if the proxy is unavailable.
 */
async function warmUpTranslation(): Promise<void> {
  try {
    await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello", source: "en", target: "es" }),
    });
    console.log("[ADAPTATION] LibreTranslate warm-up complete");
  } catch {
    console.warn(
      "[ADAPTATION] LibreTranslate warm-up failed — cognate fallback will apply"
    );
  }
}

// ─── Public init function ─────────────────────────────────────────────────────

/**
 * Initialize the adaptation engine.
 * Call once in src/main.tsx as a side-effect import:
 *
 *   import "./utils/adaptationEngine"; // registers bus listeners
 *
 * Or call explicitly:
 *   import { initAdaptationEngine } from "./utils/adaptationEngine";
 *   initAdaptationEngine();
 */
export function initAdaptationEngine(): void {
  console.log("[ADAPTATION] Engine initialized (Phase 1 — stub)");
  console.log(`[ADAPTATION] CFS threshold: ${CFS_THRESHOLD}`);
  warmUpTranslation();
}

// Auto-initialize when imported as side-effect
initAdaptationEngine();
