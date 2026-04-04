/**
 * nlp.config.ts — Central configuration for the NLP Adaptation Layer
 *
 * All "magic numbers" and external endpoints live here.
 * In a Vite project, env vars are prefixed with VITE_.
 * In Next.js, they are prefixed with NEXT_PUBLIC_.
 *
 * To override locally, create a `.env.local` file in the project root.
 *
 * ─── Environment Variables ─────────────────────────────────────────────────
 *   VITE_NLP_TRANSLATE_URL   URL of the LibreTranslate proxy (default: /api/translate)
 *   VITE_NLP_DICT_API_URL    Base URL of the Free Dictionary API
 *   VITE_NLP_API_TIMEOUT_MS  Max wait (ms) for any external API call (default: 4000)
 *   VITE_NLP_CFS_THRESHOLD   Min CFS score to trigger adaptation (default: 1.5)
 *   VITE_NLP_ESL_STALLS      Number of stalls before ESL cognate mode (default: 3)
 *   VITE_NLP_COGNATE_SIM     Min similarity score for cognate acceptance (default: 0.6)
 */

// ─── Helper: read env with fallback (Vite / browser-safe) ─────────────────────
//
// This module runs in the browser (Vite). Env vars are injected at build time
// via import.meta.env. We never reference process.env here to avoid needing
// @types/node.

function env(key: string, fallback: string): string {
  const viteEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
  return viteEnv?.[key] ?? fallback;
}

// ─── Exported config ──────────────────────────────────────────────────────────

export const NLP_CONFIG = {
  /**
   * LibreTranslate proxy endpoint (served by Dev D's backend).
   * Never call LibreTranslate directly — always use this proxy.
   */
  TRANSLATE_URL: env("VITE_NLP_TRANSLATE_URL", "/api/translate"),

  /**
   * Free Dictionary API base URL.
   */
  DICT_API_URL: env(
    "VITE_NLP_DICT_API_URL",
    "https://api.dictionaryapi.dev/api/v2/entries/en"
  ),

  /**
   * Timeout (ms) for external API calls (translate, dictionary).
   * Increase for slow networks; decrease for snappy demos.
   */
  API_TIMEOUT_MS: Number(env("VITE_NLP_API_TIMEOUT_MS", "4000")),

  /**
   * Comprehension Friction Score threshold.
   * Adaptation fires only when CFS exceeds this value.
   * Tuned to 1.5 against the mock corpus — see calibrate-threshold.mjs.
   */
  CFS_THRESHOLD: Number(env("VITE_NLP_CFS_THRESHOLD", "1.5")),

  /**
   * Number of stalls on the same word before ESL cognate mode kicks in.
   */
  ESL_STALL_THRESHOLD: Number(env("VITE_NLP_ESL_STALLS", "3")),

  /**
   * Minimum Levenshtein-based similarity score for a translation to be
   * accepted as a cognate. Range: 0.0–1.0.
   * 0.6 filters out false friends while keeping genuine cognates.
   */
  COGNATE_SIMILARITY_THRESHOLD: Number(env("VITE_NLP_COGNATE_SIM", "0.6")),
} as const;
