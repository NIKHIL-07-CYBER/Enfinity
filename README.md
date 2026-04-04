# Distraction-Free Adaptive Reader

Welcome to the Distraction-Free Adaptive Reader. This repository orchestrates a resilient reading environment built dynamically around accessibility, zero-chrome performance layout, and localized linguistic adaptation.

## The Science of Reading
The foundation of our platform relies upon the **Simple View of Reading**, defined mathematically as $RC = D \times LC$. By analyzing and responding to comprehension constraints seamlessly, we build an optimized reading flow.

## The CFS Algorithm
Our predictive model measures these factors locally through the Cognitive Friction Score, scaling regression analysis dynamically.
$$CFS = (\text{Dale-Chall}/10) \cdot (\text{targetWPM}/\text{observedWPM}) \cdot (1 + \text{regression})$$

## Tech Stack

| Layer | Implementation | Technical Reasoning |
| :--- | :--- | :--- |
| **Offline Persistence** | Dexie.js (IndexedDB) | Exceptional offline mapping providing fast state guarantees entirely locally. |
| **Proxy Server** | Express / Node.js | Safely manages `AbortController` latency layers isolating the frontend smoothly. |
| **Translation Engine** | Docker LibreTranslate / MyMemory | Prioritized local Docker for maximum privacy, gracefully falling back to MyMemory. |

## Local Setup

**Step 1. Docker:** Start the linguistic container logic natively.
`docker run -d -p 5000:5000 libretranslate/libretranslate`

**Step 2. Server:** Execute the proxy background pipeline.
`cd backend && npm install && npm run dev`

**Step 3. Frontend:** Boot the React execution context targeting Vite.
`cd frontend && npm install && npm run dev`
