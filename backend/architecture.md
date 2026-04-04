# Backend Architecture: Distraction-Free Adaptive Reader

This document provides a detailed overview of the backend and persistence layers for the Distraction-Free Adaptive Reader.

---

## 🏗️ 1. High-Level Architecture Overview

The system is designed as a hybrid backend/persistence layer. While primarily operating as an **Express Proxy Server** in Node.js, it also includes a robust **Client-Side Persistence Layer** (using Dexie.js) and **React Hooks** to unify state management across browser sessions.

---

## 🔌 2. API & Proxy Layer (`server/index.ts`)

The Express server serves as a resilient middleman between the frontend and external linguistic services.

### Key Responsibilities:
- **Linguistic Proxying (`/api/translate`)**: 
    - Proxies requests to a local **LibreTranslate** Docker container.
    - **Failover Logic**: If the local service fails or exceeds the **410ms** latency threshold, it automatically pivots to the **MyMemory API**.
    - **Circuit Breaker**: Once a failover is triggered, it sticks to the MyMemory API for the session duration to ensure zero lag.
- **Complexity Analysis (`/api/simplify`)**: 
    - Queries the **Free Dictionary API** for synonyms and definitions.
    - Implements a **3s timeout** to maintain the "Distraction-Free" experience.
- **CORS Hardening**: Explicitly allows local development ports (`5173`, `3000`, etc.) and production Vercel domains via environment variables.
- **Latency Audit Middleware**: Logs the duration of every request and triggers specific `[SLOW]` warnings for routes exceeding the 410ms threshold.

---

## 💾 3. Persistence Layer (`src/db/` & `src/utils/persistence.ts`)

The project uses **Dexie.js** (IndexedDB) as the primary storage engine, providing a local-first architecture.

### Schema Definition (`database.ts`):
- **telemetry**: Tracks reading events (`paragraphId`, `timestamp`).
- **adaptations**: Stores linguistic modifications (`originalWord`, `replacement`, `timestamp`).
- **session**: A singleton table (`id: 'current'`) storing user progress (`lastParagraphId`, `scrollY`).

### Polyfills:
- Includes **`fake-indexeddb`** polyfills for Node.js environments, ensuring the database logic can be tested or executed outside of a browser.

---

## 🧠 4. Business & Logic Utilities (`src/utils/`)

- **Readability Engine (`paragraphUtils.ts`)**:
    - **Dale-Chall Score**: Implements the New Dale–Chall (1995) formula, identifying "difficult" words against a 3,000-word familiar list.
    - **Parser**: Converts raw Markdown into an array of strictly formatted `Paragraph` objects (`p-001` format).
- **Persistence Wrappers (`persistence.ts`)**: Structured async wrappers for session saving, telemetry logging, and total data resets.
- **Accessibility (`accessibility.ts`)**: Logic for **ARIA Live Regions**, ensuring screen readers announce word adaptations ("Word X simplified to Y").

---

## 🔗 5. State Synchronization Hooks (`src/hooks/`)

These hooks bridge the gap between UI state (Zustand) and the persistent database.

- **`useSessionPersistence`**: 
    - Implements **5-second debounced** saves to IndexedDB on scroll.
    - Provides a **synchronous fallback** to `localStorage` via `beforeunload` to prevent data loss on tab closure.
- **`useSessionRestore`**: 
    - Orchestrates a "Multi-Layer Recovery" (IndexedDB → localStorage).
    - Executes precise **Scroll Anchor Restoration** with a 150ms stabilization delay.

---

## 🌐 6. Offline & Deployment (`public/sw.js` & Cloud Configs)

### Service Worker:
- Minimal, Workbox-less implementation.
- **Strategy**: 
    - "Cache First" for critical corpus and assets (`/corpus/`, `/demo-passage.md`).
    - "Network First" for standard fetch operations.

### Deployment:
- **Vercel (`vercel.json`)**: Configures rewrites to proxy all `/api/*` traffic to the Railway backend.
- **Railway (`railway.toml`)**: Optimizes the Node environment with custom healthchecks and restart policies.

---

## 📦 Directory Structure

```text
backend/
├── server/
│   └── index.ts          # API Entry Point & Proxy Logic
├── src/
│   ├── db/
│   │   └── database.ts   # Dexie Schema & Polyfills
│   ├── hooks/
│   │   ├── useSessionPersistence.ts
│   │   └── useSessionRestore.ts
│   ├── utils/
│   │   ├── paragraphUtils.ts  # Readability & Parsing
│   │   ├── persistence.ts     # DB Wrappers
│   │   └── accessibility.ts   # ARIA logic
│   └── types/
│       └── index.ts      # Shared Interfaces
├── public/
│   └── sw.js             # Service Worker (Browser)
├── tsconfig.json         # Mixed Node/DOM Configuration
└── railway.toml          # Cloud deployment config
```
