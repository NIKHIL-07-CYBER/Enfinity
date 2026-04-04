# 🏛️ The Manuscript: UI Architecture & Integration Guide

This document outlines the front-end architecture, component responsibilities, and data flow implemented by **Dev A (UI Lead)** during Phases 1–3. It is designed to act as a clear integration manual for Dev B (Telemetry), Dev C (NLP/Adaptation), and Dev D (Data/Persistence).

---

## 📌 1. Subsystem Boundaries & Teammate Contracts

The UI is built as a highly reactive, purely functional "Consumer" layer. It strictly respects the agreed-upon data boundaries and relies entirely on stores and events populated by other domains.

| Domain                 | Teammate | Contract Mechanism                             | UI Responsibility                                                                 |
| ---------------------- | -------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| **Telemetry & State**  | Dev B    | `useTelemetryStore`, `useConceptStore`         | Subscribes to paragraph focus, CFS updates, and struggled terms via `useShallow`. |
| **NLP & Adaptations**  | Dev C    | `eventemitter3` (`adaptationBus`)              | Listens for `adaptation` events to trigger inline DOM replacements safely.        |
| **Data & Persistence** | Dev D    | `useSessionStore`, `src/utils/persistence.ts`, `parseFile` | Triggers persistence fetches on mount, saves on scroll, and parses uploaded files. |

---

## 🔄 2. Global Data Flow

### A. Document Ingest (`/upload`)
1. User drops a `.txt` or `.md` file into `<DropZone>`.
2. UI passes the File blob to **Dev D's** `parseFile(file)`.
3. The resulting `Paragraph[]` array is pushed into **Dev D's** `useSessionStore`.
4. UI signals "Success" and automatically redirects route to `/read`.

### B. Adaptive Reading (`/read`)
The core reading screen is composed of multiple reactive layers acting independently:

1. **Paragraph Rendering (`<ReadingContainer>`)**
   - Hydrates paragraphs from `useSessionStore`.
   - Injects a 1px `#chapter-end-sentinel` at the bottom. 
   - An `IntersectionObserver` watches this sentinel. When hit, it triggers a 2-second debounce, granting Dev B time to flush logs before forcing a `/review` navigation.

2. **Focus Tracking & UI Telemetry (`<ParagraphBlock>`)**
   - Reacts to **Dev B's** `useTelemetryStore.activeParagraphId`. When matched to its own `paragraph.id`, Framer Motion smoothly alters background opacity and highlight bounds.
   - Uses `data-paragraph-id="{id}"` explicitly so **Dev B's** DOM observers have stable targets to latch onto.
   - Analyzes **Dev B's** `latestCFS`. If `cfs > 1.5`, attaches a left-border and injects `paragraph-struggling` CSS class on the active paragraph.

3. **Dynamic Inline Substitution (Event Bus)**
   - Inside `<ParagraphBlock>`, a local `useReducer` subscribes to **Dev C's** `adaptationBus`.
   - When an `AdaptationEvent` matches the paragraph ID, it is dispatched to state.
   - A `useMemo` reconstructs the paragraph's string tokens, rendering `<span>` borders, tooltips (`title="original"`), and typography icons (🌐 / •) securely without `dangerouslySetInnerHTML`.

4. **Screen Reader Accessibility (ARIA)**
   - The root `<ReadPage>` mounts an invisible `#adaptation-announcer`.
   - Also listens to `adaptationBus`, dynamically updating text (`"Word 'X' simplified to 'Y'"`) and flushing it after 2 seconds to force polite Screen Reader announcements without visual disruptions.

5. **Ergonomic Adaptation (`useEyeStrainSchedule`)**
   - An interval loop operates every 30 seconds reading local elapsed time.
   - Mutates `:root` CSS Variables iteratively across thresholds (Minutes 0, 20, 40, 60) adjusting font size, background contrast, and text weight.
   - Triggers the 20-minute `<BreakPrompt>` toast automatically.

6. **State Persistence Loop**
   - `<ReadPage>` implements a `5000ms` debounced scroll listener.
   - Serializes `activeParagraphId` + `window.scrollY` and transmits to **Dev D's** `saveSession`.
   - Mount hooks gracefully fallback between `loadSession` (IndexedDB) and `localStorage`, restoring scroll position within `150ms` of hard refreshes.

### C. Session Review (`/review`)
1. Driven entirely by **Dev B's** `useConceptStore`.
2. Reads `struggledTerms` to render dynamic 2x2 grid `<TermCard>`s.
3. Maps `struggledParagraphs` through **Dev D's** `getParagraphById` to render `<StrugglePoint>` quote snippets representing maximal cognitive friction.

---

## 🛠️ 3. Optimization Rules Applied

If you are expanding any UI components, please respect the following optimization rules established in Phase 2:

* **Zustand Granularity:** When reading from global stores (like `useTelemetryStore`), always import `useShallow` to prevent unrelated CFS events from destroying React's render tree.
* **Stable Event Targets:** CSS identifiers (`#chapter-end-sentinel`, `#adaptation-announcer`, `[data-paragraph-id="..."]`) are intentionally stable. Ensure your native vanilla-JS observer bindings map directly to these semantic IDs.
* **Component Freeze:** `<ParagraphBlock>` is heavily optimized with `React.memo` and `useMemo` for word tracking. Avoid passing non-primitive inline props to it from `<ReadingContainer>`. 
* **Framer Motion Sub-tree:** The `<ChromeShell>` implements `pointer-events: none` directly in its Hidden variants. `position: fixed` elements inside Framer elements behave relative to the animating parent; do not nest multiple motion layers over the main DOM scroll targets.
