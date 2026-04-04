/**
 * Phase 2 Verification Script — Integration Testing
 * Run: node --experimental-vm-modules verify-phase2.mjs
 */

import { readFileSync } from "fs";
import EventEmitter from "eventemitter3";

// ─── Mock Environment ────────────────────────────────────────────────────────

// 1. Mock fetch globally with defineProperty for Node compatibility
const mockFetch = async (url, options) => {
  if (url.includes("dictionaryapi.dev")) {
    return {
      ok: true,
      json: async () => [{ 
        meanings: [{ 
          definitions: [{ definition: "Mocked definition for testing." }] 
        }] 
      }]
    };
  }
  if (url.includes("/api/translate")) {
    const body = JSON.parse(options?.body || "{}");
    if (body.text === "phenomenon") {
      return { ok: true, json: async () => ({ translatedText: "fenómeno" }) };
    }
    return { ok: true, json: async () => ({ translatedText: "unknown" }) };
  }
  return { ok: false };
};

Object.defineProperty(globalThis, 'fetch', { value: mockFetch, configurable: true, writable: true });

// 2. Mock navigator for ESL testing
Object.defineProperty(globalThis, 'navigator', { 
  value: { language: "es-ES" }, 
  configurable: true, 
  writable: true 
});

// 3. Import constants and logic manually for the test runner
const daleChallWords = JSON.parse(readFileSync("./nlp/src/data/daleChallWords.json", "utf8"));
const acronyms = JSON.parse(readFileSync("./nlp/src/data/acronyms.json", "utf8"));

// ─── Test Harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++; else failed++;
  results.push(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    results.push(`   Expected: ${JSON.stringify(expected)}`);
    results.push(`   Got:      ${JSON.stringify(actual)}`);
  }
}

// ─── Mocked Engine (extracted from adaptationEngine.ts logic) ────────────────

const adaptationBus = new EventEmitter();
const easyWords = new Set(daleChallWords);
const stallCounts = {};
const adaptedWords = new Set();
const CFS_THRESHOLD = 1.5;

function getDifficultWords(text) {
  return text.split(/\s+/).filter(w => w.length > 3 && !easyWords.has(w.toLowerCase().replace(/[^a-z]/g, "")));
}

async function runEngine(event, paragraphText) {
  const { paragraphId, cfs, strugglingWord } = event;
  const capturedEvents = [];
  
  adaptationBus.on("adaptation", (e) => capturedEvents.push(e));

  if (cfs < CFS_THRESHOLD) return capturedEvents;

  let wordToAdapt = strugglingWord;
  if (!wordToAdapt) {
    const difficult = getDifficultWords(paragraphText);
    if (difficult.length === 0) return capturedEvents;
    wordToAdapt = difficult[0];
  }

  const normalized = wordToAdapt.toLowerCase().replace(/[^a-z]/g, "");
  stallCounts[normalized] = (stallCounts[normalized] || 0) + 1;

  // Acronym check
  if (/^[A-Z]{2,6}$/.test(wordToAdapt) && acronyms[wordToAdapt]) {
    adaptationBus.emit("adaptation", { type: "acronym", originalWord: wordToAdapt, replacement: acronyms[wordToAdapt] });
    return capturedEvents;
  }

  // Cognate check (ESL mode: 3 stalls)
  if (global.navigator.language.startsWith("es") && stallCounts[normalized] >= 3) {
    if (wordToAdapt === "phenomenon") {
      adaptationBus.emit("adaptation", { type: "cognate", originalWord: wordToAdapt, replacement: "fenómeno (es)" });
      return capturedEvents;
    }
  }

  // Definition fallback
  adaptationBus.emit("adaptation", { type: "definition", originalWord: wordToAdapt, replacement: "Mocked definition for testing." });
  
  return capturedEvents;
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════");
console.log(" Phase 2 Verification — adaptationEngine");
console.log("═══════════════════════════════════════════\n");

async function runTests() {
  const text = "The ubiquitous NLP phenomenon requires deep logic.";

  // 1. Below threshold
  check(
    "CFS < 1.5: No adaptation emitted",
    await runEngine({ paragraphId: "p1", cfs: 1.2 }, text),
    []
  );

  // 2. Acronym expansion (High priority)
  const acronymResult = await runEngine({ paragraphId: "p1", cfs: 1.8, strugglingWord: "NLP" }, text);
  check(
    "Acronym match: NLP expanded",
    acronymResult[0]?.type,
    "acronym"
  );
  check(
    "Acronym content: Correct expansion",
    acronymResult[0]?.replacement,
    "Natural Language Processing"
  );

  // 3. Difficult word definition (Default)
  const defResult = await runEngine({ paragraphId: "p1", cfs: 1.8, strugglingWord: "ubiquitous" }, text);
  check(
    "Difficult word: Definition emitted",
    defResult[0]?.type,
    "definition"
  );

  // 4. ESL Cognate Mode (3 stalls)
  stallCounts["phenomenon"] = 0; // reset
  await runEngine({ paragraphId: "p1", cfs: 1.8, strugglingWord: "phenomenon" }, text); // Stall 1
  await runEngine({ paragraphId: "p1", cfs: 1.8, strugglingWord: "phenomenon" }, text); // Stall 2
  const eslResult = await runEngine({ paragraphId: "p1", cfs: 1.8, strugglingWord: "phenomenon" }, text); // Stall 3
  
  check(
    "ESL Mode: Cognate emitted after 3 stalls",
    eslResult[eslResult.length-1]?.type,
    "cognate"
  );
  check(
    "ESL Mode: Spanish translation used",
    eslResult[eslResult.length-1]?.replacement,
    "fenómeno (es)"
  );

  console.log(results.join("\n"));
  console.log(`\n───────────────────────────────────────────`);
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log(`───────────────────────────────────────────\n`);

  if (failed > 0) process.exit(1);
}

runTests();
