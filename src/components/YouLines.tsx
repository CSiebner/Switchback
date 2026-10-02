import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getHiker, type Trail } from '../data/seed'
import { formatTime } from '../lib/format'
import { formatSplit } from './Split'
import { RouteGlyph } from './RouteGlyph'
import { heroPhoto } from '../data/photos'
import { leaderboard, useAppStore } from '../store/useAppStore'

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
  if (l.runCount < 2) return 'One time so far'
  const gain = l.firstSec - l.pb
  if (gain <= 0) return `First time is still the best`
  const minutes = Math.round(gain / 60)
  const cut = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
  return `${cut} off your first time`
}

export function YouLines({ lines }: { lines: YouLine[] }) {
  const runs = useAppStore((s) => s.runs)
  return (
    <section className="yo-section">
      <span className="survey head">Lines you know</span>
      {lines.length === 0 && (
        <p className="survey hairline" style={{ padding: '16px 0' }}>No lines yet · log a hike to start your logbook</p>
      )}
      {lines.map((l, i) => {
        const first = l.rank === 1
        const board = leaderboard(runs, l.trail.id)
        const ahead = l.rank > 1 ? board[l.rank - 2] : undefined
        const aheadName = ahead ? (getHiker(ahead.userId)?.name ?? 'Hiker') : undefined
        return (
          <motion.div
            key={l.trail.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
          >
            <Link to={`/trail/${l.trail.id}`} className="hairline yo-row" style={{ alignItems: 'stretch' }}>
              <span style={{ width: 84, height: 72, borderRadius: 12, overflow: 'hidden', position: 'relative', flex: '0 0 84px' }}>
                {heroPhoto(l.trail.id) && (
                  <img src={heroPhoto(l.trail.id)!.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <span style={{ position: 'absolute', left: 6, bottom: 6 }}>
                  <RouteGlyph coords={l.trail.path} size={28} stroke={first ? '#f5b544' : '#e4eeeb'} strokeWidth={2.4} />
                </span>
              </span>
              <span className="yo-text">
                <span className="yo-name">{l.trail.name}</span>
                <span className="survey num">
                  #{l.rank} of {l.of}
                  {ahead && aheadName ? ` · ${formatSplit(l.pb - ahead.timeSec).replace('+', '')} behind ${aheadName}` : first ? ' · holding the line' : ''}
                </span>
                <span className="survey">{lineTrend(l)}</span>
              </span>
              <span className={`yo-pb ${first ? 'gold' : ''}`}>{formatTime(l.pb)}</span>
            </Link>
          </motion.div>
        )
      })}
    </section>
  )
}
