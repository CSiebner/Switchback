import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 11 12 4l8 7v9H4z" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18 9 6l4 9 3-5 4 8" />
    </svg>
  ),
  crews: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="9" cy="9" r="3" />
      <circle cx="16.5" cy="10.5" r="2.5" />
      <path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
      <path d="M14.5 19c.4-1.8 1.6-3 3.5-3 1.4 0 2.4.7 3 2" />
    </svg>
  ),
  you: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5" />
    </svg>
  ),
}

export function NavDock() {
  const { pathname } = useLocation()
  const runs = useAppStore((s) => s.runs)
  const hidden = pathname.startsWith('/record') || pathname.startsWith('/result') || pathname.startsWith('/hike')
  const lastTrailId = runs.filter((r) => r.userId === 'you').sort((a, b) => b.timestamp - a.timestamp)[0]?.trailId

  return (
    <nav className={`nav-dock ${hidden ? 'hidden' : ''}`} aria-label="Primary">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
        {Icon.home}
        <span className="nav-label">Home</span>
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        {Icon.map}
        <span className="nav-label">Map</span>
      </NavLink>
      <NavLink to={lastTrailId ? `/record?trail=${lastTrailId}` : '/record'} className="nav-record" aria-label="Record a hike">
        <span className="disc">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="12" cy="12" r="6" />
          </svg>
        </span>
      </NavLink>
      <NavLink to="/crews" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        {Icon.crews}
        <span className="nav-label">Crews</span>
      </NavLink>
      <NavLink to="/you" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        {Icon.you}
        <span className="nav-label">You</span>
      </NavLink>
    </nav>
  )
}
