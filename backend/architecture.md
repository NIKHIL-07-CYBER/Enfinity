# Backend Architecture: Distraction-Free Adaptive Reader

This document provides a detailed overview of the backend and persistence layers for the Distraction-Free Adaptive Reader.

---

## 1. High-Level Architecture Overview

The system is designed as a hybrid backend/persistence layer. While primarily operating as an **Express Proxy Server** in Node.js, it also includes a robust **Client-Side Persistence Layer** (using Dexie.js) and **React Hooks** to unify state management across browser sessions.

### System Map

```text
+-----------------------------------------------------+
|                   Browser Client                     |
|  +--------+  +----------+  +---------------------+  |
|  | Vite   |  | Zustand  |  | Dexie.js (IndexedDB)|  |
|  | React  |  | Stores   |  | Session / Telemetry |  |
|  +--------+  +----------+  +---------------------+  |
|  | ReadingProgressBar  | ChromeShell (300ms fade)  | |
|  | FocusModeButton     | TimeRemaining (200 WPM)  | |
|  | OfflineBadge (SW)   | CFS Pulse Animation      | |
|  +-----------------------------------------------------+
|  | Session Restore (DOM-ready polling w/ backoff)  | |
|  | Dynamic Brightness Adapter (time/session/lux)   | |
|  +-----------------------------------------------------+
          |                    |
          v                    v
+-------------------+  +-------------------+
| Express Proxy     |  | Supabase          |
| (server/index.ts) |  | (Cloud Sync)      |
| /api/translate    |  | user_documents    |
| /api/simplify     |  | reading_sessions  |
| /api/chat         |  | user_highlights   |
| /api/documents/*  |  | reading_analytics |
+-------------------+  +-------------------+
    |           |
    v           v
+---------+  +------------------+
| Docker  |  | MyMemory API     |
| Libre   |  | (Fallback)       |
| Trans.  |  | w/ 5s timeout    |
+---------+  +------------------+
    \___________/
     Race Strategy
     (Promise.any)
```

---

## 2. API and Proxy Layer (`server/index.ts`)

The Express server serves as a resilient middleman between the frontend and external linguistic services.

### Key Responsibilities:
- **Linguistic Proxying (`/api/translate`)**:
    - **Race Strategy**: Simultaneously hits both the local Docker container and MyMemory API using `Promise.any()`. Uses whichever returns a valid translation first to guarantee the < 410ms target.
    - **Docker AbortController**: 4s timeout with automatic abort.
    - **MyMemory AbortController**: 5s timeout with automatic abort.
    - **Circuit Breaker with Recovery**: Once Docker exceeds 410ms, the system falls back to MyMemory-only mode. Every 30 requests, it re-probes Docker to allow recovery.
- **Complexity Analysis (`/api/simplify`)**:
    - Queries the **Free Dictionary API** for synonyms and definitions.
    - Implements a **3s timeout** to maintain the "Distraction-Free" experience.
- **AI Chat (`/api/chat`)**:
    - Claude Haiku-powered reading assistant with conversation history.
    - 12s timeout with graceful degradation.
- **CORS Hardening**: Explicitly allows local development ports (`5173`, `3000`, etc.) and production Vercel domains via environment variables.
- **Latency Audit Middleware**: Logs the duration of every request and triggers specific `[SLOW]` warnings for routes exceeding the 410ms threshold.

---

## 3. Persistence Layer (`src/db/` and `src/utils/persistence.ts`)

The project uses **Dexie.js** (IndexedDB) as the primary storage engine, providing a local-first architecture.

### Schema Definition (`database.ts`):
- **v1 Schema**:
  - **telemetry**: Tracks reading events (`paragraphId`, `timestamp`).
  - **adaptations**: Stores linguistic modifications (`originalWord`, `replacement`, `timestamp`).
  - **session**: A singleton table (`id: 'current'`) storing user progress (`lastParagraphId`, `scrollY`).
- **v2 Schema** (additive):
  - **documents**: Offline-cached user documents (`id`, `userId`, `title`, `content`, `createdAt`).

### Polyfills:
- Includes **`fake-indexeddb`** polyfills for Node.js environments, ensuring the database logic can be tested or executed outside of a browser.

---

## 4. Business and Logic Utilities (`src/utils/`)

- **Readability Engine (`paragraphUtils.ts`)**:
    - **Dale-Chall Score**: Implements the New Dale-Chall (1995) formula, identifying "difficult" words against a 3,000-word familiar list.
    - **Parser**: Converts raw Markdown into an array of strictly formatted `Paragraph` objects (`p-001` format, 1-based indexing).
    - **Paragraph ID contract**: `generateParagraphId(index)` returns `p-${String(index + 1).padStart(3, '0')}`. This is the shared contract used by both frontend and backend.
- **Persistence Wrappers (`persistence.ts`)**: Structured async wrappers for session saving, telemetry logging, and total data resets.
- **Accessibility (`accessibility.ts`)**: Logic for **ARIA Live Regions**, ensuring screen readers announce word adaptations ("Word X simplified to Y").

---

## 5. State Synchronization Hooks (`src/hooks/`)

These hooks bridge the gap between UI state (Zustand) and the persistent database.

- **`useSessionPersistence`**:
    - Implements **5-second debounced** saves to IndexedDB on scroll.
    - Provides a **synchronous fallback** to `localStorage` via `beforeunload` to prevent data loss on tab closure.
- **`useSessionRestore`**:
    - Orchestrates a "Multi-Layer Recovery" (IndexedDB -> localStorage).
    - Executes **DOM-ready polling** with exponential backoff (50, 100, 200, 400, 500ms) instead of a fixed delay, eliminating race conditions between state hydration and DOM rendering.

---

## 6. UI Layer Enhancements

### ChromeShell (Zero-Chrome Aesthetic)
- Uses CSS `transform: translateY()` + `opacity` transitions (300ms) to hide/show navigation.
- `contain: layout` prevents layout shifts during transitions.
- No Framer Motion dependency -- pure CSS for performance.

### ParagraphBlock Transitions
- Opacity: 400ms `cubic-bezier(0.25, 0.1, 0.25, 1.0)` for smooth spotlight effect.
- GPU-composited via `transform: translateZ(0)` and `backface-visibility: hidden`.
- CFS struggle indicator: Pulsing left-border glow animation (`cfs-pulse`, 2s cycle) with inset shadow when CFS > 1.5.

### Reading Progress Bar
- 2px fixed bar at viewport top tracking `window.scrollY` relative to total document height.
- Updated via `requestAnimationFrame` for jank-free rendering.

### Time Remaining
- Calculates remaining words from active paragraph index at 200 WPM.
- Displayed in ChromeShell as an unobtrusive badge.

### Focus Mode
- Toggle button (Ctrl+Shift+F) sets `--paragraph-opacity: 0.1` for non-active paragraphs.
- Hides all chrome elements except the focus button itself.

### Offline Badge
- Monitors `navigator.onLine` and `online`/`offline` events.
- Shows/hides a subtle badge in the ChromeShell.

### Mobile Responsive (375px)
- Reading container padding: 24px on mobile.
- Active paragraph box hidden on small screens.
- BreakPrompt positioned at bottom-left to avoid reading flow obstruction.
- Focus button scaled down on mobile.

---

## 7. Offline and Deployment (`public/sw.js` and Cloud Configs)

### Service Worker:
- Minimal, Workbox-less implementation.
- **Strategy**:
    - "Cache First" for critical corpus and assets (`/corpus/`, `/demo-passage.md`).
    - "Network First" for standard fetch operations.

### Deployment:
- **Vercel (`vercel.json`)**: Configures rewrites to proxy all `/api/*` traffic to the Railway backend.
- **Railway (`railway.toml`)**: Optimizes the Node environment with custom healthchecks and restart policies.

---

## 8. Directory Structure

```text
backend/
+-- server/
|   +-- index.ts          # API Entry Point, Race Strategy, Proxy Logic
|   +-- routes/
|       +-- documents.ts   # Document CRUD routes
|       +-- summarize.ts   # AI summarization routes
+-- src/
|   +-- db/
|   |   +-- database.ts   # Dexie Schema (v1 + v2) and Polyfills
|   +-- hooks/
|   |   +-- useSessionPersistence.ts
|   |   +-- useSessionRestore.ts
|   +-- utils/
|   |   +-- paragraphUtils.ts  # Readability, Parsing, p-001 IDs
|   |   +-- persistence.ts     # DB Wrappers
|   |   +-- accessibility.ts   # ARIA logic
|   +-- types/
|       +-- index.ts      # Shared Interfaces
+-- public/
|   +-- sw.js             # Service Worker (Browser)
+-- tsconfig.json         # Mixed Node/DOM Configuration
+-- railway.toml          # Cloud deployment config
```
