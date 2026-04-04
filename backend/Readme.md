# Distraction-Free Adaptive Reader (Backend & Infrastructure)

## The Science

The foundation of our adaptive reading experience is built on the **Simple View of Reading**:
$RC = D \times LC$ (Reading Comprehension = Decoding $\times$ Linguistic Comprehension)

To optimize cognitive load in real-time, we developed the **Cognitive Friction Score (CFS)** formula:
$$CFS = (DaleChall / 10) \times (targetWPM / observedWPM) \times (1 + regression)$$

## The Spine (Dev D Role)

The backend and persistence layer act as the central spine, supporting all other functional domains to guarantee a seamless, zero-latency user experience.

- **For Dev A (UI)**: Provides the `useSessionRestore` hook, ensuring instant, zero-chrome transitions back to the exact scroll position and paragraph.
- **For Dev B (Telemetry)**: Provides the `saveTelemetryEvent` persistence bridge to securely store continuous sensor data into IndexedDB without blocking the main thread.
- **For Dev C (NLP)**: Serves the `/api/translate` proxy to prevent frontend CORS failures and provides `announceAdaptation` to update a hidden `aria-live` element for accessible screen readers.

## Tech Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| **Persistence** | Dexie.js | Offline-first / Acid compliance for high-frequency telemetry. |
| **Markdown Parsing** | marked | Lightweight string stripping for ingestion. |
| **API Proxy** | Express / Node.js | Fast orchestration, fail-safe timeouts, CORS hardening. |
| **External API** | node-fetch@2 | Server-side fetch consistency and timeout control. |

## Setup Instructions

### 1. Start the Translation Service
We use LibreTranslate locally as a privacy-respecting baseline. Start it via Docker:
```bash
docker run -d -p 5000:5000 libretranslate/libretranslate
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Backend Proxy Server
```bash
npm run dev
```
