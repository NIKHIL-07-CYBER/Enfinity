# 📑 Enfinity — Adaptive Reader UI

The frontend for the **Enfinity** project, built for a seamless, distraction-free reading experience integrated with real-time comprehension telemetry.

## ✨ Features

- **Clean Typography**: Optimized for long-form reading with Georgia and ui-monospace fonts.
- **Real-time Telemetry**: Integrated with the `@telemetry` module to monitor reading speed and struggle.
- **Adaptive UI**: Responsive design that adapts to the reader's needs.
- **Debug Overlay**: Toggleable panel (`Ctrl+Shift+D`) to visualize data in real-time.

## 🚀 Getting Started

### Installation
From the root directory:
```bash
npm install
```

### Running the App
From the `UI/adaptive-reader` directory:
```bash
npm run dev
```

### Build
To build for production:
```bash
npm run build
```

## 🏗️ Technical Details

- **Framework**: React 19 + Vite
- **Routing**: `react-router-dom` (Current route: `/read`)
- **State Management**: `zustand`
- **Styling**: `tailwindcss` + `@tailwindcss/postcss`
- **Path Aliases**:
  - `@telemetry`: Points to the repo-root `telemetry/` module.

---

*Part of the Enfinity adaptive reading ecosystem.*
