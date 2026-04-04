# NLP & Adaptation Layer — Enfinity

This module is the NLP-driven intelligence layer for the hackathon project **Enfinity**. It provides real-time, context-aware reading interventions based on user struggle signals emitted by the Telemetry layer.

---

## 0. Judges' Quick Look

Our logic targets the **Comprehension Friction Score (CFS)** computed by `telemetry/utils/cfsCalculator.ts`.

### Key Innovations
1. **Three-Layer Adaptation Logic**:
   - ⚡ **Acronyms**: `NLP` → `Natural Language Processing` (Instant / Offline).
   - 🌎 **Cognates**: `phenomenon` → `fenómeno` (ESL users, triggers after 3 stalls).
   - 📖 **Definitions**: 3-layer graceful degradation: API → Local NLP → Constant fallback.
2. **Safety by Design**:
   - **False Cognate Blocklist**: 64+ EN–ES pairs blocked (e.g. `embarrassed` ≠ `embarazada`).
   - **Similarity Gate**: Translations rejected below 60% Levenshtein similarity.
   - **CFS Gate**: No intervention fires below the configured threshold.
3. **Zero Hardcoding**: All magic numbers and endpoints live in `nlp.config.ts`, driven by environment variables. No AI values are baked into source code.
4. **Shared Event Bus**: `adaptationBus.ts` (EventEmitter3) is the single integration point for UI, Telemetry, and Persistence teams.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Configuration (Environment Variables)](#configuration-environment-variables)
5. [API Reference](#api-reference)
6. [Telemetry Integration](#telemetry-integration)
7. [Verification & Calibration](#verification--calibration)
8. [Roadmap](#roadmap)
9. [Final Demo Passage](#final-demo-passage)

---

## Overview

The NLP layer is the **brain** of the Distraction-Free Adaptive Reader. When a user struggles with a word, this layer:
1. **Identifies** the hardest word using the Dale-Chall 3,000-word vocabulary list.
2. **Decides** the best intervention — definition, acronym expansion, or cognate.
3. **Emits** a structured `AdaptationEvent` to the UI via the shared event bus.

### Adaptation Decision Tree

```
telemetry emits triggerAdaptation { paragraphId, cfs, strugglingWord? }
        │
        ├─ CFS < VITE_NLP_CFS_THRESHOLD (default 1.5)? ───→ SKIP
        │
        ├─ Word is ACRONYM? (e.g. "NLP") ─────────────────→ EXPAND → "Natural Language Processing"
        │
        ├─ User is ESL AND stall count ≥ VITE_NLP_ESL_STALLS (default 3)?
        │   └─ Similarity ≥ VITE_NLP_COGNATE_SIM (default 0.6)?
        │       └─ Not a false cognate? ────────────────→ COGNATE → "fenómeno (es)"
        │
        └─ Default ──────────────────────────────────────→ DEFINITION (3-layer fallback)
```

---

## Architecture

We use a **Decoupled Event-Driven Architecture** — the NLP layer never touches the DOM directly.

```
Telemetry (cfsCalculator.ts)
        │
        │  emits: triggerAdaptation
        ▼
adaptationBus.ts  ◄──── shared EventEmitter3 instance
        │
        ▼
adaptationEngine.ts  ─── Decision Tree
        ├── nlpUtils.ts         (word filtering, acronym expand)
        ├── cognateMapper.ts    (translation, similarity, blocklist)
        └── definitionFetcher.ts (API → NLP → constant)
        │
        │  emits: AdaptationEvent
        ▼
UI (Dev A) + Persistence (Dev D)
```

---

## File Structure

```text
nlp/
├── .env.example              ← Copy to .env.local to customize
├── src/
│   ├── nlp.config.ts         ← ⭐ ALL config values here (no hardcoding)
│   ├── data/
│   │   ├── daleChallWords.json    # 3,000-word easy vocabulary list
│   │   ├── acronyms.json          # 57 common tech/academic acronyms
│   │   ├── falseCognates.json     # 64+ EN–ES false cognate pairs
│   │   ├── mockCorpus.json        # Multi-difficulty calibration passages
│   │   └── demoPassage.json       # Judge demo passage (pre-configured)
│   ├── types/
│   │   └── index.ts               # AdaptationEvent, TriggerAdaptationEvent
│   └── utils/
│       ├── adaptationBus.ts       # Shared EventEmitter3 instance
│       ├── adaptationEngine.ts    # Core decision tree (Phase 2+3)
│       ├── nlpUtils.ts            # Word filtering & acronym expansion
│       ├── cognateMapper.ts       # Translation, similarity gate, blocklist
│       ├── definitionFetcher.ts   # 3-layer definition fetcher
│       └── paragraphUtils.ts      # Persistence bridge (Dev D contract)
├── verify-phase1.mjs         # Core logic test (12 assertions)
├── verify-phase2.mjs         # Integration & decision tree test (6 assertions)
└── calibrate-threshold.mjs   # CFS threshold tuning tool

telemetry/                    ← Pulled from origin/telemetry branch
├── utils/
│   ├── cfsCalculator.ts      # CFS formula: difficulty × speed × regression
│   ├── telemetryPipeline.ts  # processParagraphExit() → fires triggerAdaptation
│   └── keywordExtractor.ts   # Frequency-based difficult term extractor
├── store/
│   ├── telemetryStore.ts     # Zustand store for CFS events
│   └── conceptStore.ts       # Zustand store for struggled terms/paragraphs
├── hooks/                    # React hooks: dwell, regression, hesitation, resume
├── components/
│   └── TelemetryOverlay.tsx  # Debug overlay for reading metrics
└── index.ts                  # Public API for the telemetry module
```

---

## Configuration (Environment Variables)

> **No values are hardcoded in source files.** Everything is driven from `nlp/src/nlp.config.ts` which reads from Vite environment variables.

Copy `nlp/.env.example` to `.env.local` in the project root and override any value:

```env
# Translation proxy (Dev D's backend)
VITE_NLP_TRANSLATE_URL=/api/translate

# Free Dictionary API base URL
VITE_NLP_DICT_API_URL=https://api.dictionaryapi.dev/api/v2/entries/en

# Max wait (ms) for any external API call before local fallback
VITE_NLP_API_TIMEOUT_MS=4000

# Min CFS to trigger adaptation (calibrated: 1.5)
VITE_NLP_CFS_THRESHOLD=1.5

# Stalls before ESL cognate mode activates
VITE_NLP_ESL_STALLS=3

# Min Levenshtein similarity to accept a translation as a cognate
VITE_NLP_COGNATE_SIM=0.6
```

---

## API Reference

### `adaptationBus`
Shared EventEmitter3 instance. Import from `nlp/src/utils/adaptationBus.ts`.

```typescript
// Listen for processed interventions (UI team)
adaptationBus.on('adaptation', (event: AdaptationEvent) => { ... });

// Fire a struggle signal (Telemetry team — or use telemetryPipeline.ts directly)
adaptationBus.emit('triggerAdaptation', { paragraphId, cfs });
```

### `AdaptationEvent` (output)
```typescript
{
  paragraphId: string;   // Which paragraph triggered the event
  wordIndex: number;     // Position of the word in paragraph text
  originalWord: string;  // The word the user struggled with
  replacement: string;   // Acronym expansion / cognate / definition
  type: 'acronym' | 'cognate' | 'definition';
  confidence: number;    // 0.0–1.0
}
```

### `fetchDefinition(word: string): Promise<string>`
100% reliable — never throws. Falls through three layers:
1. Free Dictionary API (`VITE_NLP_DICT_API_URL`)
2. `compromise.js` part-of-speech hint (offline)
3. Generic placeholder (fail-safe)

### `fetchCognate(word, lang): Promise<string | null>`
Returns e.g. `"fenómeno (es)"` or `null` if any safety filter rejects it.
Safety chain: False cognate blocklist → 4s timeout → Similarity gate.

---

## Telemetry Integration

The `telemetry/` folder (pulled from `origin/telemetry`) provides the full pipeline that feeds our NLP layer.

### How it connects
1. `useParagraphDwell` + `useRegressionTracker` hooks collect raw reading signals.
2. `processParagraphExit(paragraphId, observedWPM, daleChallScore)` in `telemetryPipeline.ts` computes the CFS.
3. If `CFS > 1.5`, it emits `triggerAdaptation` on `adaptationBus`.
4. Our `adaptationEngine.ts` listens and fires the appropriate intervention.

### CFS Formula
```
CFS = (daleChallScore / 10) × (targetWPM / observedWPM) × (1 + regressionRate)
```

---

## Verification & Calibration

### Phase 1 — Core Logic
```bash
node nlp/verify-phase1.mjs
```
Expected: **12 passed, 0 failed** — regex, similarity scores, and data JSON integrity.

### Phase 2 — Integration & Decision Tree
```bash
node nlp/verify-phase2.mjs
```
Expected: **6 passed, 0 failed** — decision tree priority and 3-stall ESL requirement.

### CFS Calibration
```bash
node nlp/calibrate-threshold.mjs
```
Runs the engine against the mock corpus at 7 different threshold values. **Confirmed 1.5 as optimal** (blocks elementary text, captures university-level difficulty).

---

## Roadmap

| Phase | Hours | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| Phase 1 | 0–4 | ✅ Done | Bus, types, `nlpUtils`, data files, cognate mapper |
| Phase 2 | 4–14 | ✅ Done | Full engine decision tree, stall tracking, deduplication |
| Phase 3 | 14–20 | ✅ Done | Persistence bridge, CFS tuning, mock corpus |
| Phase 4 | 20–24 | ✅ Done | Demo passage, edge-case hardening, telemetry pull |
| **Hardcoding Fix** | Post-24h | ✅ Done | `nlp.config.ts` — all values env-driven, no hardcoding |

---

## Final Demo Passage

Pre-configured in `nlp/src/data/demoPassage.json`. To showcase all three layers during the judge demo:

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Trigger on word `"NLP"` | Expands to `"Natural Language Processing"` instantly |
| 2 | Trigger on word `"ubiquitous"` | Shows dictionary definition via API |
| 3 | Send 3 stalls on `"phenomenon"` with `navigator.language = "es"` | Shows `"fenómeno (es)"` |
