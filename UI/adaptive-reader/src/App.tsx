import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ReadingPage } from './pages/ReadingPage'
import { ROUTES } from './constants/routes'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.read} element={<ReadingPage />} />
        {/* Redirect root to reading page for now */}
        <Route path="/" element={<Navigate to={ROUTES.read} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
