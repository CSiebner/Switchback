import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NavDock } from './components/NavDock'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { TrailDetail } from './pages/TrailDetail'
import { Record } from './pages/Record'
import { Result } from './pages/Result'
import { Crews } from './pages/Crews'
import { You } from './pages/You'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ minHeight: '100dvh' }}
    >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/trail/:id" element={<TrailDetail />} />
        <Route path="/record" element={<Record />} />
        <Route path="/result" element={<Result />} />
        <Route path="/crews" element={<Crews />} />
        <Route path="/you" element={<You />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell full-bleed">
        <AnimatedRoutes />
        <NavDock />
      </div>
    </BrowserRouter>
  )
}
