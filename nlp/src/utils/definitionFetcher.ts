import nlp from "compromise";
import { NLP_CONFIG } from "../nlp.config";

// ─── fetchDefinition ──────────────────────────────────────────────────────────

/**
 * Fetches a word definition with a three-layer graceful degradation strategy:
 *   1. Free Dictionary API (rich definitions, examples)
 *   2. Local NLP Fallback (compromise.js: part-of-speech based generic hint)
 *   3. Simple "Difficult word" placeholder (fail-safe)
 *
 * @param word  The word to define
 * @returns     A short definition string (max ~80 characters)
 *
 * @example
 *   fetchDefinition("ubiquitous")
 *   // → "present, appearing, or found everywhere."
 *
 *   fetchDefinition("logic")
 *   // → "reasoning conducted or assessed according to strict principles of validity."
 */
export async function fetchDefinition(word: string): Promise<string> {
  const cleanWord = word.toLowerCase().trim();

  try {
    // Layer 1: Dictionary API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NLP_CONFIG.API_TIMEOUT_MS);

    const res = await fetch(`${NLP_CONFIG.DICT_API_URL}/${cleanWord}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
        let definition = data[0].meanings[0].definitions[0].definition;
        
        // Clean up and truncate
        if (definition.length > 85) {
          definition = definition.substring(0, 82) + "...";
        }
        return definition;
      }
    }
  } catch (error) {
    if ((error as any).name === "AbortError") {
      console.warn(`[DEFINITION] API request timed out for "${cleanWord}"`);
    } else {
      console.warn(`[DEFINITION] API error for "${cleanWord}":`, error);
    }
  }

  // Layer 2: Local NLP Fallback (compromise.js)
  return getLocalFallback(cleanWord);
}

/**
 * Internal helper to generate a basic meaning hint based on POS tags.
 * Ensures the system never shows "Definition not found".
 */
function getLocalFallback(word: string): string {
  const doc = nlp(word);
  const tags = doc.out("tags")?.[0]?.tags || [];

  if (tags.includes("ProperNoun")) return "A specific name, place, or entity.";
  if (tags.includes("Noun")) return "A person, place, thing, or idea.";
  if (tags.includes("Verb")) return "An action, occurrence, or state of being.";
  if (tags.includes("Adjective")) return "A word describing a quality or state.";
  if (tags.includes("Adverb")) return "A word describing an action or quality.";

  // Layer 3: Fail-safe generic
  return "A challenging word used in this context.";
}
