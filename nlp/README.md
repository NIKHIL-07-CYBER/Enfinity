# NLP & Adaptation Layer: Final Demo (Phase 4)

This repository contains the NLP-driven intelligence layer for the hackathon project **Enfinity**. It provides real-time, context-aware reading interventions based on user struggle signals.

---

## 0. Judges' Quick Look (Phase 4)

Our logic targets the **Comprehension Friction Score (CFS)** emitted by Telemetry.

### Key Innovations (Hours 0-24)
1. **Three-Layer Logic**:
   - ⚡ **Acronyms**: `NLP` → `Natural Language Processing` (Instant / Offline).
   - 🌎 **Cognates**: `phenomenon` → `fenómeno` (ESL mode / 3-stall trigger).
   - 📖 **Definitions**: Robust 3-layer fetch (API → Local NLP → Constant Fallback).
2. **Safety Measures**:
   - **False Cognate Blocklist**: Rejects misleading translations like `embarrassed` (64+ pairs).
   - **Similarity Threshold**: All cognates must meet a 60% similarity score to prevent confusion.
3. **Optimized Integration**: Single event bus (`adaptationBus.ts`) shared across UI, Backend, and Telemetry teams.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [API Reference](#api-reference)
5. [Verification & Calibration](#verification--calibration)
6. [Roadmap](#roadmap)

---

## Overview

The NLP layer is the **brain** of the Distraction-Free Adaptive Reader. When a user struggles with a word or paragraph, this layer:
1. **Identifies** the most difficult word using the Dale-Chall 3,000-word vocabulary list.
2. **Decides** the best intervention — definition, acronym expansion, or cognate (for ESL readers).
3. **Emits** a structured `AdaptationEvent` to the UI via a shared event bus.

### Adaptation Decision Tree (Phase 4)

```
triggerAdaptation event received
        │
        ├─ CFS < 1.5? ──────────────────────────────→ SKIP (not struggling enough)
        │
        ├─ Word is ACRONYM? (e.g. "NLP") ──────────→ EXPAND (e.g. "Natural Language Processing")
        │
        ├─ User is ESL AND stall count ≥ 3?
        │   └─ Word has cognate? ──────────────────→ COGNATE SWAP (e.g. "fenómeno")
        │       └─ Word is false cognate? ────────→ BLOCK (Safety First)
        │
        └─ Default ────────────────────────────────→ DEFINITION (3-layer fallback)
```

---

## Architecture

We use a **Decoupled Event-Driven Architecture**.

- **Input**: `TriggerAdaptationEvent` (from Telemetry).
- **Processing**: `adaptationEngine.ts` (Decision logic) + NLP Utility classes.
- **Output**: `AdaptationEvent` (to UI).
- **Persistence**: `saveAppliedAdaptation` (to Persistence).

---

## File Structure

```text
nlp/
├── src/
│   ├── data/           # Reference lists (Dale-Chall, Acronyms, Cognates)
│   ├── types/          # Shared interfaces (Events, Requests)
│   └── utils/
│       ├── adaptationBus.ts      # Shared Eventemitter3 instance
│       ├── adaptationEngine.ts   # Core decision tree
│       ├── nlpUtils.ts           # Word filtering & acronyms
│       ├── cognateMapper.ts      # Translation logic & blocklists
│       └── definitionFetcher.ts  # 3-layer API/Local fallbacks
├── verify-phase1.mjs   # Core logic verification
├── verify-phase2.mjs   # Integration & Decision Tree test
└── calibrate-threshold.mjs # CFS tuning against mock corpus
```

---

## API Reference

### `adaptationBus`
Shared event emitter for cross-team communication.
- `on('triggerAdaptation', ...)`: Listen for struggle signals.
- `emit('adaptation', ...)`: Send processed intervention to UI.

### `fetchDefinition(word)`
**Reliability**: 100% (High-availability strategy).
1. Primary: Free Dictionary API.
2. Fallback: `compromise.js` POS-hint.
3. Fail-safe: Generic contextual placeholder.

---

## Verification & Calibration

### Core Logic Test
```bash
node nlp/verify-phase1.mjs
```
Checks: Regex safety, similarity scores, and data JSON integrity.

### Integration Test
```bash
node nlp/verify-phase2.mjs
```
Checks: Decision tree priority and 3-stall ESL requirement.

### CFS Calibration
```bash
node nlp/calibrate-threshold.mjs
```
Analyzes hit-rates on Easy vs. University level text. **Confirmed 1.5 as optimal.**

---

## Roadmap

| Phase | Hours | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| Phase 1 | 0–4 | ✅ **Done** | Bus, types, `nlpUtils`, core data files |
| Phase 2 | 4–14 | ✅ **Done** | Full engine decision tree, stall tracking |
| Phase 3 | 14–20 | ✅ **Done** | Persistence integration, CFS tuning |
| Phase 4 | 20–24 | ✅ **Done** | Demo passage, error hardening, README Final |

---

## Final Demo Passage (Judge Approved)

The system is pre-configured with `nlp/src/data/demoPassage.json`.
Test it by triggering 3 stalls on the word **"phenomenon"** to see the ESL logic, or trigger on **"NLP"** to see instant expansion.
