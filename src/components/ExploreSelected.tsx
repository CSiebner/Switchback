import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { RouteGlyph } from './RouteGlyph'
import { heroPhoto } from '../data/photos'
import { formatTime, relativeTime } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import { lineStats, type Line } from './ExploreModel'

const EASE = [0.22, 1, 0.36, 1] as const

function survey(l: Line): string {
  if (l.pb === undefined) return 'typical · not yet on your logbook'
  const board = `PB · #${l.rank} of ${l.boardSize}`
  if (l.holds) {
    return l.below
      ? `holding the line · ${formatTime(l.below.timeSec - l.pb)} ahead of ${l.below.name}`
      : 'holding the line · unchallenged'
  }
  if (l.above && l.gap !== undefined) return `${board} · ${formatTime(l.gap)} behind ${l.above.name}`
  return board
}

export function ExploreSelected({ line }: { line: Line }) {
  const navigate = useNavigate()
  const setChase = useAppStore((s) => s.setChase)
  const { trail, pb, holds, above, fresh } = line
  const big = pb ?? trail.typicalMin * 60
  const pct = fresh ? Math.round(Math.min(1, fresh.conf) * 100) : 0

  const start = () => navigate(`/record?trail=${trail.id}`)
  const useTheirs = () => {
    if (!above) return
    setChase({ trailId: trail.id, userId: above.userId, timeSec: above.timeSec, label: above.name })
    navigate(`/record?trail=${trail.id}&against=1`)
  }
  const photo = heroPhoto(trail.id)

  return (
    <motion.div
      key={trail.id}
      className="ex-selected"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {photo && (
        <img src={photo.thumb} alt="" style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 14, marginBottom: 12 }} />
      )}
      <div className="ex-head">
        <RouteGlyph
          key={trail.id}
          coords={trail.path}
          size={56}
          stroke={holds ? '#d97706' : '#0f201e'}
          strokeWidth={2.6}
        />
        <div className="ex-head-text">
          <p className="display ex-name">{trail.name}</p>
          <p className="survey num">
            {trail.region} · {trail.difficulty} · {lineStats(trail)}
          </p>
        </div>
      </div>

      <div className="ex-big-wrap">
        <p className="display num ex-big" style={{ color: holds ? 'var(--larch)' : 'var(--ink)' }}>
          {formatTime(big)}
        </p>
        <p className="survey num ex-big-sub">
          {survey(line)}
        </p>
      </div>

      <div className="ex-fresh">
        {fresh ? (
          <>
            <span className="survey num">
              {fresh.tags.join(' + ').toLowerCase()} · {relativeTime(fresh.timestamp)}
            </span>
            <span className="ex-bar" aria-hidden>
              <motion.span
                className="ex-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            </span>
          </>
        ) : (
          <span className="survey">no recent reports</span>
        )}
      </div>

      <div className="btn-row ex-cta">
        <Link to={`/trail/${trail.id}`} className="btn btn-ghost" style={{ flex: '1 1 0' }}>
          Open line
        </Link>
        <button className="btn btn-larch" style={{ flex: '1.4 1 0' }} onClick={start}>
          Hike this line
        </button>
        {above && (
          <button className="btn btn-ghost" style={{ flex: '1 1 0' }} onClick={useTheirs}>
            Their time
          </button>
        )}
      </div>
    </motion.div>
  )
}
