# 🧠 Telemetry Engine — Enfinity

The **Telemetry Module** is the core intelligence of the Enfinity reader. It tracks, calculates, and manages state for user engagement and comprehension.

## 🧱 Core Modules

### 1. Store (`/store`)
- **`telemetryStore`**: Tracks `CFSEvent` history, active paragraph, and the latest CFS metrics.
- **`conceptStore`**: Manages the "Struggle Graph" — lists of struggled terms and paragraphs.

### 2. Hooks (`/hooks`)
- **`useParagraphDwell`**: Uses `IntersectionObserver` to track accurate reading time per paragraph.
- **`useRegressionTracker`**: Analyzes scroll direction to detect re-reading (upward scrolls).
- **`useHighlightHesitation`**: Monitors word-level mouse-down duration (>800ms) to identify confusion.
- **`useTelemetryResume`**: Restores the session from `localStorage` on page load.

### 3. Utils (`/utils`)
- **`cfsCalculator`**: Implements the proprietary Comprehension Friction Score formula.
- **`telemetryPipeline`**: The orchestrator that processes raw dwell times, calculates CFS, updates stores, and emits adaptation events.
- **`keywordExtractor`**: Pulls difficult words from a paragraph using a Dale-Chall filter.

### 4. Components (`/components`)
- **`TelemetryOverlay`**: A fixed debug panel providing real-time visualization of all engine metrics.

## 🧮 CFS Formula

The engine evaluates "friction" using:
```typescript
CFS = (daleChall / 10) * (targetWPM / observedWPM) * (1 + regressionRate)
```

## 🔌 Integration

The module is exposed as a library through `index.ts`. All other modules (`UI/`, `nlp/`, `backend/`) should import only from the root `index.ts`.

Example:
```typescript
import { useParagraphDwell, TelemetryOverlay } from '@telemetry';
```

---

*Ensuring every reader finds their flow.*