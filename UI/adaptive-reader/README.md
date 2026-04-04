# Distraction-Free Adaptive Reader

> An EdTech reading environment that eliminates distraction, tracks comprehension
> implicitly, and adapts text difficulty in real time.

## Features

### Core reading features
- **Zero-chrome UI** — all navigation fades when scrolling; click anywhere to restore with a spring animation
- **Focus Mode** — single button hides ALL UI except reading text (Ctrl+Shift+F)
- **Dynamic brightness** — automatically adjusts screen brightness based on time of day, session length, and ambient light

### Intelligence layer
- **Comprehension Friction Score (CFS)** — real-time reading difficulty metric:
  `CFS = (Dale-Chall/10) × (targetWPM/observedWPM) × (1 + regressionRate)`
- **Dynamic text adaptation** — inline definitions, synonyms, and acronym expansions triggered when CFS > 1.5
  (can be toggled on/off with the Auto-adapt button)
- **ESL cognate mapper** — swaps difficult English words for cognates in the user's native language

### Selection & annotation
- **Selection toolbar** — select any word, phrase, or sentence for instant:
  - Translation (LibreTranslate + MyMemory fallback)
  - Pronunciation (IPA + text-to-speech)
  - Definition (Free Dictionary API)
  - Color highlighting (5 colors, persists across refresh)
  - Save to folder (exportable as .txt)

### AI chatbot
- **Floating reading assistant** — context-aware chatbot that knows which paragraph
  you are currently reading
- Customizable avatar: emoji, color, size, drag-to-reposition
- Quick actions: "Explain this paragraph", "Define difficult words", "Summarize so far"

### Persistence
- **Deep state persistence** — scroll position, adaptations, and highlights survive hard refresh
- **Archive** — past reading sessions saved and resumable
- **Session telemetry** — paragraph-level struggle data stored in IndexedDB

## Tech stack
| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Fast DX, type safety |
| Styling | Tailwind CSS + CSS variables | Design token system |
| Animation | Framer Motion (selective) | Spring physics for chrome burst |
| State | Zustand | Minimal boilerplate |
| Persistence | Dexie.js (IndexedDB) | Offline-first, typed schema |
| NLP (client) | compromise.js | Zero-dependency browser NLP |
| File parsing | marked.js | MD/TXT stripping |
| Translation | LibreTranslate (Docker) + MyMemory | Privacy-first, fallback chain |
| AI Chat | Anthropic Claude Haiku | Fast, cost-efficient |
| Backend | Express + Node.js | Lightweight proxy layer |
| Deployment | Vercel (frontend) + Railway (backend) | Free tier, instant deploy |

## Running locally

### Prerequisites
- Node.js 18+
- Docker (for LibreTranslate)
- Anthropic API key (for chatbot — optional, stub responses if not set)

### Setup
```bash
# 1. Start LibreTranslate (takes ~3 minutes first run)
docker run -d -p 5000:5000 libretranslate/libretranslate

# 2. Start backend
cd backend/server
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env (optional)
npm install
npm run start  # runs on :3001

# 3. Start frontend
cd UI/adaptive-reader
npm install
npm run dev  # runs on :5173
```

### Environment variables (server/.env)
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...   # Optional — chatbot returns stub without it
FRONTEND_URL=http://localhost:5173
```

## Keyboard shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+Shift+D` | Toggle telemetry debug overlay |
| `Ctrl+Shift+F` | Toggle focus mode |

## Architecture

```
Enfinity/
├── UI/adaptive-reader/      # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/      # Reader, Layout, Selection, Chatbot, Upload, Review
│   │   ├── hooks/           # useActiveParagraph, useTextSelection, useUIVisibility, useDynamicBrightness
│   │   ├── store/           # Zustand stores (session, telemetry, concept, ui, settings, selection, chatbot)
│   │   ├── pages/           # Upload, Read, Review, Archive, Settings
│   │   └── utils/           # adaptationBus, paragraphUtils, persistence, pronunciationUtils
├── telemetry/               # CFS pipeline, dwell tracking, regression detection
├── nlp/                     # NLP engine, cognate mapper, adaptation bus
└── backend/                 # Express proxy server with translation + chat APIs
```

## License
MIT
