import nlp from "compromise";
import daleChallWords from "../data/daleChallWords.json";
import acronymList from "../data/acronyms.json";

// ─── Dale-Chall easy-word lookup (O(1) per word) ──────────────────────────────
const easyWords = new Set(daleChallWords as string[]);

// ─── Acronym map ──────────────────────────────────────────────────────────────
const acronymMap: Record<string, string> = acronymList as Record<string, string>;

// ─── getDifficultWords ────────────────────────────────────────────────────────

/**
 * Identifies words in `text` that are NOT in the Dale-Chall 3,000 "easy" list.
 *
 * Filters OUT:
 *   - Words ≤ 3 characters (articles, pronouns — never worth flagging)
 *   - Non-alphabetic tokens (numbers, punctuation)
 *   - Proper nouns (names, places, orgs — they're hard by nature, not complexity)
 *   - Dale-Chall easy words
 *
 * @param text  Raw paragraph text
 * @returns     Ordered array of difficult words (deduplicated, lowercased)
 *
 * @example
 *   getDifficultWords("The ubiquitous phenomenon")
 *   // → ["ubiquitous", "phenomenon"]
 *
 *   getDifficultWords("The cat sat on the mat")
 *   // → []
 *
 *   getDifficultWords("London has ubiquitous transportation")
 *   // → ["ubiquitous", "transportation"]  (NOT "London")
 */
export function getDifficultWords(text: string): string[] {
  // Edge case: empty or invalid input
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return [];
  }

  const doc = nlp(text);

  // Build proper noun exclusion set
  const properNouns = new Set(
    (doc.match("#ProperNoun").out("array") as string[]).map((w: string) =>
      w.toLowerCase()
    )
  );

  const words = doc.terms().out("array") as string[];
  const seen = new Set<string>();

  return words
    .map((w) => w.replace(/[.,!?;:]/g, "")) // Clean punctuation
    .filter((w) => w.length > 3)
    .filter((w) => /^[a-zA-Z'’-]+$/.test(w)) // Allow apostrophes and hyphens
    .map((w) => w.replace(/['’]s$/, "")) // Strip possessives for lookup
    .filter((w) => !easyWords.has(w.toLowerCase()))
    .filter((w) => !properNouns.has(w.toLowerCase()))
    .filter((w) => {
      // Deduplicate while preserving order
      const key = w.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ─── expandAcronym ────────────────────────────────────────────────────────────

/**
 * Expands an acronym using a two-layer strategy:
 *   1. Curated acronym dictionary (`src/data/acronyms.json`) — primary
 *   2. Context-based regex: looks for "Full Term (ACRONYM)" pattern in surrounding text
 *
 * @param acronym  The uppercase acronym to expand (e.g. "NLP")
 * @param context  The surrounding paragraph text for contextual matching
 * @returns        Full expansion string, or null if not found
 *
 * @example
 *   expandAcronym("NLP", "...")  → "Natural Language Processing"
 *   expandAcronym("FOO", "Natural Language Processing (NLP)...")  → null (not FOO)
 *   expandAcronym("NLQ", "Natural Language Queries (NLQ) power...")  → "Natural Language Queries"
 */
export async function expandAcronym(
  acronym: string,
  context: string
): Promise<string | null> {
  // Layer 1: Curated dictionary (fast, no network)
  if (acronymMap[acronym]) return acronymMap[acronym];

  // Layer 2: Contextual regex — "Full Name (ACRONYM)" pattern
  const escapedAcronym = acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const contextMatch = context.match(
    new RegExp(
      `([A-Z][a-z]+(?:\\s+[A-Za-z]+){1,5})\\s*\\(${escapedAcronym}\\)`
    )
  );
  if (contextMatch) return contextMatch[1];

  return null;
}

// ─── isAcronym ────────────────────────────────────────────────────────────────

/**
 * Quick check: is this word shaped like an acronym?
 * Matches 2–6 uppercase letters only (e.g. "NLP", "HTML", "ADHD").
 * Does NOT match mixed-case abbreviations like "PhD".
 */
export function isAcronym(word: string): boolean {
  return /^[A-Z]{2,6}$/.test(word);
}
