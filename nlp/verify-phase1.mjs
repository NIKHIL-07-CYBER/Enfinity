/**
 * Phase 1 Verification Script
 * Run: node --experimental-vm-modules verify-phase1.mjs
 *
 * Or run individual checks below using the compiled JS output.
 * This script validates the core logic without requiring a full build.
 */

// ─── Levenshtein / cognateSimilarity — pure logic, no imports needed ─────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function cognateSimilarity(w1, w2) {
  const dist = levenshtein(w1.toLowerCase(), w2.toLowerCase());
  const maxLen = Math.max(w1.length, w2.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// ─── Dale-Chall easy words ────────────────────────────────────────────────────
const { readFileSync } = await import("fs");
const easyWords = new Set(
  JSON.parse(readFileSync("./src/data/daleChallWords.json", "utf8"))
);

// ─── getDifficultWords (simplified, no compromise.js proper-noun filter) ──────
function getDifficultWordsSimple(text) {
  return text
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => /^[a-zA-Z]+$/.test(w))
    .filter(w => !easyWords.has(w.toLowerCase()));
}

// ─── False cognates ───────────────────────────────────────────────────────────
const falseCognates = JSON.parse(
  readFileSync("./src/data/falseCognates.json", "utf8")
);

function isFalseCognate(word, lang) {
  return (falseCognates[lang] ?? []).includes(word.toLowerCase());
}

// ─── Acronyms ─────────────────────────────────────────────────────────────────
const acronyms = JSON.parse(
  readFileSync("./src/data/acronyms.json", "utf8")
);

// ─── Run checks ───────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function check(label, actual, expected, comparator = (a, e) => a === e) {
  const ok = comparator(actual, expected);
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${label}`);
  if (!ok) console.log(`   Expected: ${JSON.stringify(expected)}\n   Got:      ${JSON.stringify(actual)}`);
  ok ? passed++ : failed++;
}

console.log("\n═══════════════════════════════════════════");
console.log(" Phase 1 Verification — adaptive-reader");
console.log("═══════════════════════════════════════════\n");

// 1. getDifficultWords — hard text
check(
  "getDifficultWords: ubiquitous + phenomenon are flagged",
  getDifficultWordsSimple("The ubiquitous phenomenon"),
  ["ubiquitous", "phenomenon"],
  (a, e) => JSON.stringify(a) === JSON.stringify(e)
);

// 2. getDifficultWords — easy text
check(
  "getDifficultWords: easy sentence returns []",
  getDifficultWordsSimple("The cat sat on the mat"),
  [],
  (a, e) => JSON.stringify(a) === JSON.stringify(e)
);

// 3. cognateSimilarity — true cognate
check(
  "cognateSimilarity: flame/flamme ≥ 0.80",
  cognateSimilarity("flame", "flamme"),
  0.80,
  (a, e) => a >= e
);

// 4. cognateSimilarity — Spanish cognate
check(
  "cognateSimilarity: nation/nacion ≥ 0.80",
  cognateSimilarity("nation", "nacion"),
  0.80,
  (a, e) => a >= e
);

// 5. False cognate in blocklist
check(
  "isFalseCognate: embarrassed blocked for ES",
  isFalseCognate("embarrassed", "es"),
  true
);

// 6. Safe word NOT in blocklist
check(
  "isFalseCognate: nation is NOT a false cognate for ES",
  isFalseCognate("nation", "es"),
  false
);

// 7. False cognate blocklist size (EN-ES)
check(
  "falseCognates.json: ES list has ≥ 50 entries",
  falseCognates["es"].length,
  50,
  (a, e) => a >= e
);

// 8. Acronym dictionary size
check(
  "acronyms.json: ≥ 50 entries",
  Object.keys(acronyms).length,
  50,
  (a, e) => a >= e
);

// 9. Acronym lookup
check(
  "acronyms.json: NLP → Natural Language Processing",
  acronyms["NLP"],
  "Natural Language Processing"
);

// 10. Dale-Chall list size
check(
  "daleChallWords.json: ≥ 2900 words",
  easyWords.size,
  2900,
  (a, e) => a >= e
);

// 11. Easy words in set
check("daleChallWords.json: 'cat' is easy", easyWords.has("cat"), true);
check("daleChallWords.json: 'ubiquitous' is NOT listed as easy", easyWords.has("ubiquitous"), false);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n───────────────────────────────────────────`);
console.log(` Results: ${passed} passed, ${failed} failed`);
console.log(`───────────────────────────────────────────\n`);

if (failed > 0) process.exit(1);
