import { Link, useLocation } from 'react-router-dom'
import { Mark } from './Mark'

/** The lockup, fixed, on every screen. Dusk pages use the light mark. */
export function BrandBar() {
  const { pathname } = useLocation()
  const dusk = pathname.startsWith('/record') || pathname.startsWith('/result')
  return (
    <header className={`brand-bar ${dusk ? 'dusk' : ''}`}>
      <Link to="/" aria-label="Switchback home">
        <Mark tone={dusk ? 'flour' : 'ink'} />
      </Link>
      {!dusk && pathname !== '/about' && (
        <Link to="/about" className="survey" style={{ marginLeft: 'auto', marginBottom: 4 }}>
          About
        </Link>
      )}
    </header>
  )
}
