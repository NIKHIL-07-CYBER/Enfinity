import React from 'react'
import ReactDOM from 'react-dom/client'
import { initTheme } from './utils/themeManager'
import './styles/globals.css'
import './styles/dark-overrides.css'
import App from './App.tsx'
// Side effect: registers adaptationBus listener for triggerAdaptation → UI adaptations
// NLP utilities are initialized locally

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
