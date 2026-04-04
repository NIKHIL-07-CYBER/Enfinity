import falseCognatesData from "../data/falseCognates.json";
import { NLP_CONFIG } from "../nlp.config";

// ─── False cognate blocklist ───────────────────────────────────────────────────
const falseCognates: Record<string, string[]> = falseCognatesData as Record<
  string,
  string[]
>;

// ─── Supported target languages ───────────────────────────────────────────────
const SUPPORTED_LANGUAGES = ["es", "fr", "de", "pt", "hi", "zh"] as const;
type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number] | "en";

// ─── levenshtein (internal) ───────────────────────────────────────────────────

/**
 * Classic Levenshtein edit distance — insertions, deletions, substitutions.
 * Time complexity: O(m * n) where m, n are string lengths.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── cognateSimilarity ────────────────────────────────────────────────────────

/**
 * Normalized similarity score between two words.
 * Formula: 1 - (levenshtein(a, b) / max(|a|, |b|))
 *
 * Returns 1.0 for identical strings, 0.0 for maximally different.
 * We use ≥ 0.6 as the threshold for "cognate-like enough" to show.
 *
 * @example
 *   cognateSimilarity("flame", "flamme")           // → ~0.83 ✅ French cognate
 *   cognateSimilarity("nation", "nacion")          // → ~0.83 ✅ Spanish cognate
 *   cognateSimilarity("embarrassed", "embarazada") // → ~0.72 ⛔ false cognate (must be blocked by blocklist)
 *   cognateSimilarity("cat", "perro")              // → ~0.0  ⛔ not a cognate
 */
export function cognateSimilarity(word1: string, word2: string): number {
  const dist = levenshtein(word1.toLowerCase(), word2.toLowerCase());
  const maxLen = Math.max(word1.length, word2.length);
  if (maxLen === 0) return 1; // both empty → identical
  return 1 - dist / maxLen;
}

// ─── isFalseCognate ───────────────────────────────────────────────────────────

/**
 * Checks if a word is a known false cognate for the target language.
 * The blocklist lives in `src/data/falseCognates.json`.
 *
 * Always call this BEFORE fetching a translation — it is the safety net
 * that prevents misleading cognate suggestions.
 *
 * @param word        English word (case-insensitive)
 * @param targetLang  ISO 639-1 language code ("es", "fr", "de", "pt")
 * @returns           true if the word is a known false cognate
 *
 * @example
 *   isFalseCognate("embarrassed", "es") // → true  ⛔ blocked
 *   isFalseCognate("nation", "es")      // → false ✅ safe to translate
 */
export function isFalseCognate(word: string, targetLang: string): boolean {
  const blocklist: string[] = falseCognates[targetLang] ?? [];
  return blocklist.includes(word.toLowerCase());
}

// ─── detectUserLanguage ───────────────────────────────────────────────────────

/**
 * Detects the user's preferred language via `navigator.language`.
 * Maps to a supported language code; returns "en" if unsupported.
 *
 * Used by the adaptation engine to decide whether to show cognates (ESL mode)
 * vs. definitions (native English mode).
 *
 * @returns ISO 639-1 code: "es" | "fr" | "de" | "pt" | "hi" | "zh" | "en"
 */
export function detectUserLanguage(): SupportedLang {
  const lang = navigator.language.split("-")[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as SupportedLang)
    : "en";
}

// ─── fetchCognate ─────────────────────────────────────────────────────────────

/**
 * Fetches a potential cognate translation via Dev D's LibreTranslate proxy.
 *
 * Safety filters applied (in order):
 *   1. False cognate blocklist check (synchronous, no network)
 *   2. 4-second timeout on the translation request
 *   3. Similarity threshold: result must score ≥ 0.6 on cognateSimilarity
 *
 * Returns null if any filter rejects the result or the request fails.
 * NEVER calls LibreTranslate directly — always goes through /api/translate.
 *
 * @param word        English word to translate
 * @param targetLang  ISO 639-1 code ("es", "fr", "de", "pt")
 * @returns           "traduccion (es)" format string, or null
 *
 * @example
 *   fetchCognate("nation", "es")      // → "nacion (es)"
 *   fetchCognate("embarrassed", "es") // → null (false cognate blocked)
 *   fetchCognate("cat", "es")         // → null (similarity < 0.6)
 */
export async function fetchCognate(
  word: string,
  targetLang: string
): Promise<string | null> {
  // Safety filter 1: false cognate blocklist
  if (isFalseCognate(word, targetLang)) {
    console.log(`[COGNATE] Blocked false cognate: "${word}" → lang ${targetLang}`);
    return null;
  }

  try {
    const res = await fetch(NLP_CONFIG.TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word, source: "en", target: targetLang }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const { translatedText } = (await res.json()) as { translatedText: string };
    if (!translatedText) return null;

    // Safety filter 2: similarity threshold
    const similarity = cognateSimilarity(word, translatedText);
    if (similarity < NLP_CONFIG.COGNATE_SIMILARITY_THRESHOLD) {
      console.log(
        `[COGNATE] Rejected "${word}" → "${translatedText}" (similarity ${similarity.toFixed(2)} < ${NLP_CONFIG.COGNATE_SIMILARITY_THRESHOLD})`
      );
      return null;
    }

    return `${translatedText} (${targetLang})`; // e.g. "nacion (es)"
  } catch {
    return null;
  }
}
