import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Trail } from '../data/seed'
import { formatTime, relativeTime } from '../lib/format'
import { RouteGlyph } from './RouteGlyph'

const EASE = [0.22, 1, 0.36, 1] as const

export interface YouLine {
  trail: Trail
  pb: number
  rank: number
  of: number
  firstTs: number
  firstSec: number
  runCount: number
}

function lineTrend(l: YouLine) {
  if (l.runCount < 2) return 'one run · go again'
  const gain = l.firstSec - l.pb
  if (gain <= 0) return `first run is still best · since ${relativeTime(l.firstTs)}`
  return `−${formatTime(gain)} since ${relativeTime(l.firstTs)}`
}

export function YouLines({ lines }: { lines: YouLine[] }) {
  return (
    <section className="yo-section">
      <span className="survey head">Your lines · best first</span>
      {lines.length === 0 && (
        <p className="survey hairline" style={{ padding: '16px 0' }}>No lines yet · log a hike to start your logbook</p>
      )}
      {lines.map((l, i) => {
        const first = l.rank === 1
        return (
          <motion.div
            key={l.trail.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
          >
            <Link to={`/trail/${l.trail.id}`} className="hairline yo-row">
              <span className="yo-glyph">
                <RouteGlyph
                  coords={l.trail.path}
                  size={48}
                  strokeWidth={2.2}
                  stroke={first ? 'var(--larch)' : 'currentColor'}
                />
              </span>
              <span className="yo-text">
                <span className="yo-name">{l.trail.name}</span>
                <span className="survey num">
                  #{l.rank} of {l.of} · {lineTrend(l)}
                </span>
              </span>
              <span className={`yo-pb ${first ? 'gold' : ''}`}>{formatTime(l.pb)}</span>
            </Link>
          </motion.div>
        )
      })}
    </section>
  )
}
