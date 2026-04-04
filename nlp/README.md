# NLP & Adaptation Layer — Dev C

> **Role in the system**: Intelligence Layer.  
> Receives struggle signals from the Telemetry layer (Dev B), decides the best text adaptation, and emits events consumed by the UI layer (Dev A).  
> **Core principle: Never touch the DOM directly. Only emit events.**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Quick Start](#quick-start)
5. [API Reference](#api-reference)
   - [adaptationBus](#adaptationbus)
   - [AdaptationEvent](#adaptationevent)
   - [TriggerAdaptationEvent](#triggeradaptationevent)
   - [getDifficultWords()](#getdifficultwords)
   - [expandAcronym()](#expandacronym)
   - [cognateSimilarity()](#cognatesimilarity)
   - [isFalseCognate()](#isfalsecognate)
   - [fetchCognate()](#fetchcognate)
   - [fetchDefinition()](#fetchdefinition)
   - [detectUserLanguage()](#detectuserlanguage)
6. [Data Files](#data-files)
7. [Integration Guide for Teammates](#integration-guide-for-teammates)
8. [Verification](#verification)
9. [Roadmap](#roadmap)
10. [Risk Mitigation](#risk-mitigation)

---

## Overview

The NLP layer is the **brain** of the Distraction-Free Adaptive Reader. When a user struggles with a word or paragraph, this layer:

1. **Identifies** the most difficult word using the Dale-Chall 3,000-word vocabulary list
2. **Decides** the best intervention — definition, acronym expansion, or cognate (for ESL readers)
3. **Emits** a structured `AdaptationEvent` to the UI via a shared event bus

### Adaptation Decision Tree

```
triggerAdaptation event received
        │
        ├─ CFS < 1.5? ──────────────────────────────→ SKIP (not struggling enough)
        │
        ├─ Word is ACRONYM? (e.g. "NLP") ──────────→ EXPAND (e.g. "Natural Language Processing")
        │
        ├─ User is ESL AND stall count ≥ 3?
        │   └─ Word has cognate? ──────────────────→ COGNATE SWAP (e.g. "nacion (es)")
        │       └─ Word is false cognate? ────────→ BLOCK (never show misleading translation)
        │
        └─ Default ────────────────────────────────→ DEFINITION (from Free Dictionary API)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Event Bus                            │
│                   (adaptationBus.ts)                        │
│                                                             │
│  Dev B ──emit──→ "triggerAdaptation" ──listen──→ Dev C (You)│
│  Dev C ──emit──→ "adaptation"        ──listen──→ Dev A      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│           NLP Processing Pipeline            │
│                                              │
│  getDifficultWords()  ←── daleChallWords.json│
│          ↓                                   │
│  isAcronym() → expandAcronym() ←── acronyms.json
│          ↓                                   │
│  detectUserLanguage()                        │
│          ↓                                   │
│  isFalseCognate() ←── falseCognates.json     │
│          ↓                                   │
│  fetchCognate() → /api/translate (Dev D)     │
│          ↓                                   │
│  fetchDefinition() → dictionaryapi.dev       │
│          ↓                                   │
│  emitAdaptation() → adaptationBus            │
└──────────────────────────────────────────────┘
```

---

## File Structure

```
nlp/
├── README.md                        ← You are here
├── package.json                     ← Dependencies: compromise, eventemitter3
├── verify-phase1.mjs                ← Phase 1 verification script (12 checks)
└── src/
    ├── types/
    │   └── index.ts                 ← Shared type contracts (all teams import from here)
    │       ├── AdaptationEvent      ← Published by Dev C → consumed by Dev A
    │       ├── TriggerAdaptationEvent ← Published by Dev B → consumed by Dev C
    │       └── Paragraph            ← Owned by Dev D
    │
    ├── utils/
    │   ├── adaptationBus.ts         ← Shared EventEmitter hub (ALL teams import this)
    │   ├── nlpUtils.ts              ← getDifficultWords(), expandAcronym(), isAcronym()
    │   ├── cognateMapper.ts         ← Levenshtein, cognateSimilarity(), isFalseCognate(), fetchCognate()
    │   └── adaptationEngine.ts      ← Main engine — listens to bus, runs decision tree, emits events
    │
    └── data/
        ├── daleChallWords.json      ← 2,942 familiar English words (Dale-Chall 1995 list)
        ├── falseCognates.json       ← False cognate blocklist (64 EN-ES, +FR/DE/PT pairs)
        └── acronyms.json            ← 57 common acronym expansions
```

---

## Quick Start

### Install dependencies

```bash
cd nlp
npm install
```

### Run verification checks

```bash
node verify-phase1.mjs
# Expected output: Results: 12 passed, 0 failed
```

### Wire into your app (Dev A)

```typescript
// In your main entry point (e.g. main.tsx / index.ts):
import { adaptationBus } from "./nlp/src/utils/adaptationBus";
import type { AdaptationEvent } from "./nlp/src/types";

// Listen for adaptation events emitted by Dev C
adaptationBus.on("adaptation", (event: AdaptationEvent) => {
  console.log("Render adaptation:", event);
  // → highlight event.originalWord at event.wordIndex
  // → show event.replacement as tooltip
});
```

### Trigger an adaptation manually (for testing)

```typescript
import { adaptationBus } from "./nlp/src/utils/adaptationBus";
import type { TriggerAdaptationEvent } from "./nlp/src/types";

// Simulate Dev B sending a struggle signal
adaptationBus.emit("triggerAdaptation", {
  paragraphId: "para-001",
  cfs: 1.8,                    // above 1.5 threshold → adaptation fires
  strugglingWord: "ubiquitous" // optional — omit for auto-detection
} satisfies TriggerAdaptationEvent);
```

---

## API Reference

### `adaptationBus`

**File**: `src/utils/adaptationBus.ts`  
**Type**: `EventEmitter` (from `eventemitter3`)

The single shared event bus. **All teams import from this file — never create a separate EventEmitter.**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `"triggerAdaptation"` | Dev B → Dev C | `TriggerAdaptationEvent` | Dev B detected user struggle |
| `"adaptation"` | Dev C → Dev A | `AdaptationEvent` | Dev C computed an adaptation to render |

```typescript
import { adaptationBus } from "./nlp/src/utils/adaptationBus";

// Listen
adaptationBus.on("triggerAdaptation", handler);
adaptationBus.on("adaptation", handler);

// Emit
adaptationBus.emit("triggerAdaptation", payload);
adaptationBus.emit("adaptation", payload);
```

---

### `AdaptationEvent`

**File**: `src/types/index.ts`  
**Published by**: Dev C | **Consumed by**: Dev A

```typescript
interface AdaptationEvent {
  paragraphId: string;   // Which paragraph to adapt
  wordIndex: number;     // 0-based index in paragraph.text.split(" ")
  originalWord: string;  // The exact word to highlight/replace
  replacement: string;   // What to show: definition / cognate / expansion
  type: "definition" | "synonym" | "cognate" | "acronym";
  confidence: number;    // 0.0–1.0 (below 0.7 = treat with caution)
}
```

**Example payloads**:
```typescript
// Definition
{ paragraphId: "p-1", wordIndex: 4, originalWord: "ubiquitous",
  replacement: "present, appearing, or found everywhere", type: "definition", confidence: 0.9 }

// Cognate (ESL mode)
{ paragraphId: "p-1", wordIndex: 4, originalWord: "ubiquitous",
  replacement: "ubicuo (es)", type: "cognate", confidence: 0.85 }

// Acronym expansion
{ paragraphId: "p-2", wordIndex: 0, originalWord: "NLP",
  replacement: "Natural Language Processing", type: "acronym", confidence: 0.95 }
```

---

### `TriggerAdaptationEvent`

**File**: `src/types/index.ts`  
**Published by**: Dev B | **Consumed by**: Dev C

```typescript
interface TriggerAdaptationEvent {
  paragraphId: string;      // Paragraph the user is struggling with
  cfs: number;              // Comprehension Friction Score (0.0–3.0)
  strugglingWord?: string;  // Optional: specific word Dev B detected hesitation on
}
```

> **CFS Threshold**: Adaptation fires only when `cfs ≥ 1.5`. Adjust `CFS_THRESHOLD` in `adaptationEngine.ts` during Phase 3 tuning.

---

### `getDifficultWords(text)`

**File**: `src/utils/nlpUtils.ts`

Identifies words in a paragraph that are NOT in the Dale-Chall 3,000 familiar-word list.

```typescript
function getDifficultWords(text: string): string[]
```

**Filters applied (in order)**:
1. Words ≤ 3 characters — skipped (articles, pronouns)
2. Non-alphabetic tokens — skipped (numbers, punctuation)
3. Proper nouns (via compromise.js `#ProperNoun`) — skipped
4. Dale-Chall easy words — skipped
5. Deduplication — each word returned once

**Examples**:
```typescript
getDifficultWords("The ubiquitous phenomenon")
// → ["ubiquitous", "phenomenon"]

getDifficultWords("The cat sat on the mat")
// → []

getDifficultWords("London has ubiquitous transportation")
// → ["ubiquitous", "transportation"]  ← "London" excluded (proper noun)
```

---

### `expandAcronym(acronym, context)`

**File**: `src/utils/nlpUtils.ts`

Expands an acronym using a two-layer strategy:

```typescript
async function expandAcronym(acronym: string, context: string): Promise<string | null>
```

| Layer | Source | Example |
|-------|--------|---------|
| 1 | Curated `acronyms.json` (primary, fast, no network) | `"NLP"` → `"Natural Language Processing"` |
| 2 | Context regex: `"Full Name (ACRONYM)"` pattern | `"Natural Language Queries (NLQ)..."` → `"Natural Language Queries"` |

Returns `null` if not found.

---

### `cognateSimilarity(word1, word2)`

**File**: `src/utils/cognateMapper.ts`

Normalized Levenshtein similarity. `1.0` = identical, `0.0` = completely different.  
Threshold for "cognate-like enough" = **≥ 0.6**.

```typescript
function cognateSimilarity(word1: string, word2: string): number
```

| Input | Output | Verdict |
|-------|--------|---------|
| `"flame"`, `"flamme"` | `~0.83` | ✅ French cognate |
| `"nation"`, `"nacion"` | `~0.83` | ✅ Spanish cognate |
| `"embarrassed"`, `"embarazada"` | `~0.72` | ⚠️ Above threshold BUT blocked by false-cognate list |
| `"cat"`, `"perro"` | `~0.0` | ❌ Not a cognate |

---

### `isFalseCognate(word, targetLang)`

**File**: `src/utils/cognateMapper.ts`

Checks if a word is a known false cognate for the target language.  
**Always called before fetching a translation — this is the primary safety net.**

```typescript
function isFalseCognate(word: string, targetLang: string): boolean
```

| Input | Output |
|-------|--------|
| `"embarrassed"`, `"es"` | `true` ← blocked (means "pregnant" in Spanish) |
| `"nation"`, `"es"` | `false` ← safe to translate |
| `"gift"`, `"de"` | `true` ← blocked (means "poison" in German) |

Supported languages: `"es"` (64 pairs), `"fr"` (18), `"de"` (20), `"pt"` (20)

---

### `fetchCognate(word, targetLang)`

**File**: `src/utils/cognateMapper.ts`

Full cognate fetch pipeline with three safety layers:

```typescript
async function fetchCognate(word: string, targetLang: string): Promise<string | null>
```

```
Layer 1: isFalseCognate() check    → block immediately if on blocklist
Layer 2: POST /api/translate       → 4-second timeout (Dev D's LibreTranslate proxy)
Layer 3: cognateSimilarity() check → reject if similarity < 0.6
```

Returns `"traduccion (es)"` format or `null` if any layer rejects.

> ⚠️ **Never call LibreTranslate directly.** Always go through `/api/translate` (Dev D's proxy).

---

---

### `fetchDefinition(word)`

**File**: `src/utils/definitionFetcher.ts`

Fetches a meaning for any English word with a robust fallback strategy to ensure uptime during the hackathon.

```typescript
async function fetchDefinition(word: string): Promise<string>
```

| Layer | Source | Reliability | Description |
|-------|--------|-------------|-------------|
| 1 | Free Dictionary API | High | Primary source for rich definitions and examples. |
| 2 | compromise.js fallback | Offline | Local POS-based hints (e.g., "A word describing a quality"). |
| 3 | Constant fallback | 100% | Fail-safe: "A challenging word used in this context." |

---

### `detectUserLanguage()`

**File**: `src/utils/cognateMapper.ts`

Reads `navigator.language` and maps to a supported language code.

```typescript
function detectUserLanguage(): "es" | "fr" | "de" | "pt" | "hi" | "zh" | "en"
```

Returns `"en"` if the browser language is unsupported. Used by the engine to decide:
- `"en"` → definition mode only
- anything else → ESL mode (cognates after 3 stalls)

---

## Data Files

### `src/data/daleChallWords.json`

The **New Dale-Chall (1995)** list of ~3,000 familiar American-English words understood by 80%+ of 5th-grade students. Words in this list are considered "easy" and will **never** be flagged as difficult.

- **Source**: [github.com/words/dale-chall](https://github.com/words/dale-chall)
- **Count**: 2,942 words
- **Format**: JSON array of lowercase strings
- **Usage**: `getDifficultWords()` filters any word present in this set

---

### `src/data/falseCognates.json`

Hand-curated blocklist of English words that look like cognates in another language but have completely different meanings.

| Language | Entries | Example |
|----------|---------|---------|
| Spanish (`es`) | 64 | `"embarrassed"` → NOT `"embarazada"` (pregnant) |
| French (`fr`) | 18 | `"pain"` → NOT `"pain"` (bread) |
| German (`de`) | 20 | `"gift"` → NOT `"Gift"` (poison) |
| Portuguese (`pt`) | 20 | `"lunch"` → NOT `"longe"` (far away) |

---

### `src/data/acronyms.json`

57 common acronyms with their full expansions. Covers:
- Tech: `NLP`, `API`, `UI`, `ML`, `IoT`, `SDK`, `JWT`, `CORS`
- Academia: `GPA`, `PhD`, `STEM`, `IELTS`, `TOEFL`
- Healthcare: `ADHD`, `PTSD`, `DNA`, `HIV`, `AIDS`
- Government: `WHO`, `UN`, `EU`, `NATO`, `NASA`, `FBI`

---

## Integration Guide for Teammates

### For Dev A (UI Layer)

**Import the bus and type:**
```typescript
import { adaptationBus } from "../nlp/src/utils/adaptationBus";
import type { AdaptationEvent } from "../nlp/src/types";
```

**Listen for adaptations:**
```typescript
adaptationBus.on("adaptation", (event: AdaptationEvent) => {
  const { paragraphId, wordIndex, originalWord, replacement, type } = event;
  // Use wordIndex to find the word in the paragraph text
  // Render an inline tooltip / underline with `replacement`
});
```

**Render rules by type:**
| `type` | Suggested UI |
|--------|-------------|
| `"definition"` | Dashed underline + tooltip with definition text |
| `"acronym"` | Brackets: `NLP [Natural Language Processing]` |
| `"cognate"` | Flag badge + translation: `ubiquitous 🇪🇸 ubicuo` |
| `"synonym"` | Soft highlight + simpler word suggestion |

---

### For Dev B (Telemetry Layer)

**Import the bus and type:**
```typescript
import { adaptationBus } from "../nlp/src/utils/adaptationBus";
import type { TriggerAdaptationEvent } from "../nlp/src/types";
```

**Emit when CFS threshold is crossed:**
```typescript
// Fire this when your telemetry detects reading struggle
adaptationBus.emit("triggerAdaptation", {
  paragraphId: currentParagraph.id,
  cfs: computedCFS,             // your CFS value (fire when > 1.5)
  strugglingWord: detectedWord  // optional — include if you detect hesitation on a specific word
} satisfies TriggerAdaptationEvent);
```

**CFS threshold guidance**:
- `cfs < 1.5` → do nothing, user is reading fine
- `cfs ≥ 1.5` → emit `triggerAdaptation` once per paragraph
- don't emit repeatedly for the same paragraph — the engine deduplicates

---

### For Dev D (Persistence Layer)

Dev C needs two functions from you:

```typescript
// 1. Retrieve paragraph text by ID
function getParagraphById(id: string): { id: string; text: string } | undefined

// 2. Persist an applied adaptation to IndexedDB
function saveAppliedAdaptation(event: AdaptationEvent): void
```

Dev C also calls your translation proxy:
```
POST /api/translate
Body: { text: string, source: "en", target: "es" | "fr" | "de" | "pt" }
Response: { translatedText: string }
```

Until Dev D is ready, `adaptationEngine.ts` uses a stub. Look for the `// uncomment when Dev D is ready` comments.

---

## Verification

### Phase 1 (Core Utilities)
```bash
node verify-phase1.mjs
```
Expected: `12 passed, 0 failed` — ensures regex, similarity, and data integrity.

### Phase 2 (Integration & Decision Tree)
```bash
node verify-phase2.mjs
```
Expected: `6 passed, 0 failed` — ensures acronym priority, 3-stall ESL requirement, and API fallback logic.

---

## Roadmap

| Phase | Hours | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| **Phase 1** — Foundation | 0–4 | ✅ **Done** | `adaptationBus`, types, `nlpUtils`, `cognateMapper`, engine stub, data files |
| **Phase 2** — Core Build | 4–14 | ✅ **Done** | `definitionFetcher.ts`, full engine decision tree, stall detection, deduplication |
| **Phase 3** — Integration | 14–20 | 🔄 Next | Wire Dev D's `getParagraphById`, CFS tuning, E2E testing with real corpus |
| **Phase 4** — Demo Prep | 20–24 | ⏳ Pending | Demo passage, LibreTranslate warm-up, edge-case hardening |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Free Dictionary API is down | compromise.js POS description as fallback (always available offline) |
| LibreTranslate not running | MyMemory API as hot backup (no key, 1000 req/day) |
| False cognate slips through | 64-entry blocklist + 0.6 similarity threshold — two independent guards |
| `getParagraphById` not ready | Stub function returns `undefined`; engine gracefully skips |
| CFS never triggers during demo | Dev B's "Simulate Struggle" button fires `triggerAdaptation` on demand |
| `wordIndex` off-by-one | `emitAdaptation` searches by word string, not index — index is derived, not assumed |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `compromise` | `^14.15.0` | NLP: tokenization, POS tagging, proper noun detection |
| `eventemitter3` | `^5.0.4` | High-performance event bus (3× faster than Node's built-in) |

---

*Dev C — NLP & Adaptation Layer | Enfinity Adaptive Reader*
