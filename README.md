# 📡 Enfinity — Distraction-Free Adaptive Reader

Enfinity is a modern, distraction-free reading platform that uses a real-time **Comprehension Friction Score (CFS)** engine to monitor reader engagement and dynamically adapt content to improve understanding.

## 🚀 Key Features

- **Adaptive Reading Engine**: Real-time content modification (definitions, synonyms, simplification) when the system detects reader struggle.
- **Multi-Layer Adaptation Logic**:
  - ⚡ **Acronym Expansion**: Instant expansion of technical terms (e.g., "NLP" → "Natural Language Processing").
  - 🌎 **ESL Cognate Swapping**: Provides linguistic bridges for ESL readers (e.g., "phenomenon" → "fenómeno") after repeated stalls.
  - 📖 **Smart Definitions**: A 3-layer fallback system (API → Local NLP → Contextual Hint).
- **Comprehension Friction Score (CFS)**: A proprietary score calculated using Dale-Chall text difficulty, reading speed (WPM), and regression rates.
- **Micro-Engagement Telemetry**:
  - **Dwell Time**: Accurate tracking of time spent per paragraph using `IntersectionObserver`.
  - **Regression Tracking**: Detection of "re-reading" behavior via upward scroll analysis.
  - **Hesitation Detection**: Identification of confusion via word-level mouse hesitation (>800ms).
- **Local-First Persistence**: Robust session recovery and data logging using **Dexie.js (IndexedDB)**.
- **Interactive Debug Overlay**: A live telemetry panel for developers and judges to see the engine's "brain" in action.

## 📁 Project Structure

The project is organized as a monorepo using **npm workspaces**:

- **`/telemetry`**: The core intelligence module.
  - `/store`: Zustand state management for CFS events and concept graphs.
  - `/hooks`: React hooks for dwell time, regression, and hesitation tracking.
  - `/utils`: Core logic for CFS calculation and the telemetry pipeline.
- **`/nlp`**: The linguistic "brain" of the project.
  - `adaptationEngine.ts`: Decision tree for memilih the best intervention.
  - `adaptationBus.ts`: Shared event bus for cross-module communication.
  - `verify-*.mjs`: Automated verification scripts for linguistic logic.
- **`/UI/adaptive-reader`**: A high-performance Vite + React frontend.
  - Framer Motion for smooth, non-distracting UI transitions.
  - Integrated with the telemetry module via `@telemetry` path alias.
- **`/backend`**: Express Proxy and Persistence Layer.
  - **Linguistic Proxy**: Resilient API access with automatic failover (LibreTranslate → MyMemory).
  - **Persistence Hooks**: Dexie.js integration for 5-second debounced background saves.

## 🧠 Adaptation Decision Tree

The NLP layer processes struggle signals using a prioritized decision tree:

```text
Struggle Signal Detected (CFS > 1.5)
        │
        ├─ Word is ACRONYM? ──────────────────────→ EXPAND
        │
        ├─ User is ESL AND stall count ≥ 3?
        │   └─ Word has COGNATE? ─────────────────→ TRANSLATE (Safety-checked)
        │
        └─ Default ───────────────────────────────→ DEFINITION (3-layer fallback)
```

## 💾 Persistence Layer

Enfinity implements a **Local-First** architecture to ensure zero data loss:
- **Primary Storage**: `IndexedDB` (via Dexie.js) for telemetry, adaptations, and session state.
- **Fallback**: `localStorage` during `beforeunload` events.
- **Recovery**: Automatic "Multi-Layer Recovery" on hard refreshes, restoring scroll position within 150ms.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Framer Motion
- **State Management**: Zustand
- **Persistence**: Dexie.js (IndexedDB)
- **NLP**: compromise.js, Dale-Chall 3,000 list
- **Backend**: Express, LibreTranslate (Docker-ready), MyMemory API
- **Testing**: Vitest, Custom MJS verification scripts

## ⌨️ Telemetry Engine (CFS)

The system computes the **Comprehension Friction Score (CFS)** using the following formula:

$$CFS = \left(\frac{DaleChallScore}{10}\right) \times \left(\frac{TargetWPM}{ObservedWPM}\right) \times (1 + RegressionRate)$$

- **Dale-Chall Score**: Text difficulty on a 0-10 scale.
- **Target WPM**: Baseline reading speed (default 150).
- **Observed WPM**: Actual reading speed calculated via dwell time.
- **Regression Rate**: Fraction of scrolls that were upward.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+ for workspaces support)

### Installation
From the root directory, run:
```bash
npm install
```

### Running the App
1. **Start the Backend Proxy**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Start the Adaptive Reader**:
   ```bash
   cd UI/adaptive-reader
   npm run dev
   ```
Navigate to `http://localhost:5173/read` to start reading.

## 📡 Live Debugging (Judge's Mode)

While on the reading page, you can open the **Telemetry Debug Overlay**:
- ⌨️ **Shortcut**: `Ctrl + Shift + D`
- **Features**:
  - Real-time CFS, WPM, and Regression Rate tracking.
  - Highlights active paragraph IDs.
  - Lists currently "struggled" paragraphs and terms.
  - **⚡ Simulate Struggle Button**: Instantly triggers a high-CFS event to demonstrate the system's adaptation capability.

---

*Built with ❤️ for the future of digital literacy.*
