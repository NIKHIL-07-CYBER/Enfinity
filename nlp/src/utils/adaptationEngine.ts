import { adaptationBus } from "./adaptationBus";
import { getDifficultWords, isAcronym, expandAcronym } from "./nlpUtils";
import { fetchCognate, detectUserLanguage } from "./cognateMapper";
import { fetchDefinition } from "./definitionFetcher";
import type { TriggerAdaptationEvent, AdaptationEvent } from "../types";

import { getParagraphById, saveAppliedAdaptation } from "./paragraphUtils";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * CFS threshold above which adaptation fires.
 * Tuned in Phase 3 (Hour 16) against easy / medium / hard passages.
 * Default: 1.5 — increase to 1.8 if too aggressive, decrease to 1.3 if too quiet.
 */
const CFS_THRESHOLD = 1.5;

/**
 * Number of stalls for a specific word before triggering ESL cognate mode.
 */
const ESL_STALL_THRESHOLD = 3;

// ─── Session-scoped state ─────────────────────────────────────────────────────

/**
 * Tracks per-word stall count this session.
 *   Key: word string (lowercase)
 *   Value: number of times a TriggerAdaptationEvent specified this word
 */
const stallCounts: Record<string, number> = {};

/**
 * Tracks adaptations already emitted this session.
 *   Key: `${paragraphId}:${word}` compound key
 */
const adaptedWords = new Set<string>();

// ─── emitAdaptation (internal helper) ────────────────────────────────────────

/**
 * Centralised emission of AdaptationEvents.
 * Calculates wordIndex from paragraph text, validates it exists,
 * then emits to Dev A via adaptationBus.
 */
function emitAdaptation(
  paragraphId: string,
  paragraphText: string,
  originalWord: string,
  replacement: string,
  type: AdaptationEvent["type"],
  confidence = 0.9
): boolean {
  // Prevent double-adapting the same word in the same paragraph
  const adaptationKey = `${paragraphId}:${originalWord.toLowerCase()}`;
  if (adaptedWords.has(adaptationKey)) {
    console.log(`[ADAPTATION] Already adapted "${originalWord}" in paragraph ${paragraphId} — skipping`);
    return false;
  }

  const words = paragraphText.split(/\s+/);
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
  adaptedWords.add(adaptationKey);
  
  // Persist for metrics (Dev D)
  saveAppliedAdaptation(event);
  
  console.log("[ADAPTATION] Emitted:", event);
  return true;
}

// ─── triggerAdaptation handler (Phase 3 Integration) ──────────────────────────

adaptationBus.on("triggerAdaptation", async (event: TriggerAdaptationEvent) => {
  // DONE: Task 4b — Check if adaptation is enabled
  const adaptationEnabled = typeof localStorage !== 'undefined'
    ? localStorage.getItem('adaptation_enabled') !== 'false'
    : true;
  if (!adaptationEnabled) return;

  const readingMode =
    typeof localStorage !== "undefined" ? localStorage.getItem("reading_mode") : null;
  if (readingMode === "permission" || readingMode === "manual") return;

  const { paragraphId, cfs, strugglingWord } = event;

  console.log(
    `[ADAPTATION] Triggered — paragraph: ${paragraphId} | CFS: ${cfs.toFixed(2)} | word: ${strugglingWord ?? "auto"}`
  );

  // 1. CFS Check
  if (cfs < CFS_THRESHOLD) {
    console.log(`[ADAPTATION] CFS ${cfs.toFixed(2)} below threshold ${CFS_THRESHOLD} — skipping`);
    return;
  }

  // 2. Data Check (Integration with Dev D via paragraphUtils)
  const paragraph = getParagraphById(paragraphId);
  if (!paragraph) return;

  // 3. Target Word Selection
  let wordToAdapt = strugglingWord;
  if (!wordToAdapt) {
    const difficultWords = getDifficultWords(paragraph.text);
    if (difficultWords.length === 0) {
      console.log("[ADAPTATION] No difficult words found in paragraph — skipping");
      return;
    }
    wordToAdapt = difficultWords[0]; // Pick the first difficult word
  }

  const normalizedWord = wordToAdapt.toLowerCase().replace(/[^a-z]/g, "");
  
  // 4. Update Stall Counts
  stallCounts[normalizedWord] = (stallCounts[normalizedWord] || 0) + 1;
  const currentStalls = stallCounts[normalizedWord];

  // 5. Decision Tree
  
  // Option A: Acronym Expansion (Highest Priority)
  if (isAcronym(wordToAdapt)) {
    const expansion = await expandAcronym(wordToAdapt, paragraph.text);
    if (expansion) {
      emitAdaptation(paragraphId, paragraph.text, wordToAdapt, expansion, "acronym", 1.0);
      return;
    }
  }

  // Option B: ESL Cognate Mode (High Priority for struggling non-native readers)
  const userLang = detectUserLanguage();
  if (userLang !== "en" && currentStalls >= ESL_STALL_THRESHOLD) {
    const cognate = await fetchCognate(wordToAdapt, userLang);
    if (cognate) {
      emitAdaptation(paragraphId, paragraph.text, wordToAdapt, cognate, "cognate", 0.85);
      return;
    }
  }

  // Option C: Definition (Default Fallback)
  const definition = await fetchDefinition(wordToAdapt);
  emitAdaptation(paragraphId, paragraph.text, wordToAdapt, definition, "definition", 0.9);
});

// ─── LibreTranslate warm-up ───────────────────────────────────────────────────

async function warmUpTranslation(): Promise<void> {
  try {
    await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello", source: "en", target: "es" }),
    });
    console.log("[ADAPTATION] LibreTranslate warm-up complete");
  } catch {
    console.warn("[ADAPTATION] LibreTranslate warm-up failed");
  }
}

// ─── Public init function ─────────────────────────────────────────────────────

export function initAdaptationEngine(): void {
  console.log("[ADAPTATION] Engine initialized (Phase 2 — Core)");
  console.log(`[ADAPTATION] CFS threshold: ${CFS_THRESHOLD} | ESL stall threshold: ${ESL_STALL_THRESHOLD}`);
  warmUpTranslation();
}

initAdaptationEngine();
