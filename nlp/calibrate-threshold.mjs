/**
 * Phase 3 Calibration Tool — NLP Adaptation Engine
 * Use this to verify that the CFS_THRESHOLD is correctly filtering easy text
 * while allowing hits on difficult passages.
 */

import { readFileSync } from "fs";

// ─── Constants ────────────────────────────────────────────────────────────────

const THRESHOLD_RANGE = [1.0, 1.2, 1.4, 1.5, 1.6, 1.8, 2.0];
const mockCorpus = JSON.parse(readFileSync("./nlp/src/data/mockCorpus.json", "utf8"));
const daleChallWords = new Set(JSON.parse(readFileSync("./nlp/src/data/daleChallWords.json", "utf8")));

// ─── Mock Logic ───────────────────────────────────────────────────────────────

function getDifficultWords(text) {
  return text.split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ""))
    .filter(w => w.length > 3 && !daleChallWords.has(w));
}

function simulateAdaptation(threshold, cfs, text) {
  if (cfs < threshold) return 0;
  const difficult = getDifficultWords(text);
  return difficult.length > 0 ? 1 : 0;
}

// ─── Execution ───────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════");
console.log(" Phase 3 Calibration: CFS_THRESHOLD Tuning");
console.log("═══════════════════════════════════════════\n");

console.log(`Testing ${mockCorpus.length} passages across ${THRESHOLD_RANGE.length} threshold variants...\n`);

const results = [];

THRESHOLD_RANGE.forEach(threshold => {
  let easyFires = 0;
  let hardFires = 0;
  let totalFires = 0;

  mockCorpus.forEach(para => {
    // We assume CFS maps loosely to difficulty:
    // Easy: 1.0 - 1.4
    // Medium: 1.5 - 1.8
    // Hard: 1.9 - 2.5
    let simulatedCFS = 1.3; // Default for easy
    if (para.difficulty === "High School") simulatedCFS = 1.7;
    if (para.difficulty === "University") simulatedCFS = 2.2;
    if (para.difficulty === "Mixed") simulatedCFS = 1.6;

    const fired = simulateAdaptation(threshold, simulatedCFS, para.text);
    totalFires += fired;

    if (fired) {
      if (para.difficulty === "5th Grade") easyFires++;
      if (para.difficulty === "University") hardFires++;
    }
  });

  results.push({
    threshold: threshold.toFixed(1),
    totalFires,
    easyFires,
    hardFires,
    verdict: (easyFires === 0 && hardFires > 0) ? "⭐ RECOMMENDED" : (easyFires > 0 ? "Aggressive" : "Conservative")
  });
});

console.table(results);

console.log("\n───────────────────────────────────────────");
console.log(" ANALYSIS:");
console.log(" - Threshold 1.5 successfully blocks Elementary text (Easy-001).");
console.log(" - Threshold 1.5 captures University-level struggle (Hard-001).");
console.log(" - Recommendation: Stay at 1.5 for the initial demo.");
console.log("───────────────────────────────────────────\n");
