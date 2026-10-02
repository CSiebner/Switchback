import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NavDock } from './components/NavDock'
import { BrandBar } from './components/BrandBar'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { TrailDetail } from './pages/TrailDetail'
import { Record } from './pages/Record'
import { Result } from './pages/Result'
import { Crews } from './pages/Crews'
import { You } from './pages/You'
import { Hike } from './pages/Hike'
import { About } from './pages/About'
import { Onboarding } from './components/Onboarding'
import { useAppStore } from './store/useAppStore'

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
        <Route path="/hike/:id" element={<Hike />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  )
}

function Gate() {
  const onboarded = useAppStore((s) => s.onboarded)
  const [phase, setPhase] = useState<'about' | 'profile'>('about')
  if (!onboarded) {
    if (phase === 'about') return <About onBegin={() => setPhase('profile')} />
    return <Onboarding onBack={() => setPhase('about')} />
  }
  return (
    <>
      <BrandBar />
      <AnimatedRoutes />
      <NavDock />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <div className="app-shell full-bleed">
        <Gate />
      </div>
    </BrowserRouter>
  )
}
