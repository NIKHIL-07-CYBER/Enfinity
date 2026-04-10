import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTheme } from './utils/themeManager'
import './styles/globals.css'
import './styles/dark-overrides.css'
import App from './App.tsx'
// Side effect: registers adaptationBus listener for triggerAdaptation → UI adaptations
import '@nlp/utils/adaptationEngine.ts'

initTheme()

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
