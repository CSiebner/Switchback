import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { CURRENT_USER_ID, getHiker, type Crew } from '../data/seed'
import { getTrail } from '../data/trails'
import { formatTime } from '../lib/format'
import { formatSplit } from './Split'
import { RouteGlyph } from './RouteGlyph'
import { bestTime, useAppStore } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const
const WEEK = 7 * 24 * 60 * 60 * 1000

interface Entry {
  key: string
  userId: string
  trailId: string
  timeSec: number
  timestamp: number
}

function crewBests(runs: { userId: string; trailId: string; timeSec: number; timestamp: number }[], members: string[], since: number) {
  const best = new Map<string, Entry>()
  for (const r of runs) {
    if (r.userId === CURRENT_USER_ID || !members.includes(r.userId) || r.timestamp < since) continue
    const key = `${r.userId}:${r.trailId}`
    const cur = best.get(key)
    if (!cur || r.timeSec < cur.timeSec) best.set(key, { key, userId: r.userId, trailId: r.trailId, timeSec: r.timeSec, timestamp: r.timestamp })
  }
  return [...best.values()].sort((a, b) => b.timestamp - a.timestamp)
}

export function CrewBoard({ crew }: { crew: Crew }) {
  const navigate = useNavigate()
  const runs = useAppStore((s) => s.runs)
  const setChase = useAppStore((s) => s.setChase)
  const [now] = useState(() => Date.now())

  const { rows, weekly } = useMemo(() => {
    const week = crewBests(runs, crew.members, now - WEEK)
    if (week.length) return { rows: week, weekly: true }
    return { rows: crewBests(runs, crew.members, 0), weekly: false }
  }, [runs, crew.members, now])

  if (!crew.members.includes(CURRENT_USER_ID)) return null

  return (
    <section className="cr-section">
      <span className="survey head">Times in the crew · {weekly ? 'this week' : 'all time'}</span>
      {rows.length === 0 && (
        <p className="survey hairline" style={{ padding: '16px 0' }}>No crew runs yet · be the first on the board</p>
      )}
      {rows.map((e, i) => {
        const trail = getTrail(e.trailId)
        if (!trail) return null
        const name = getHiker(e.userId)?.name ?? 'Hiker'
        const mine = bestTime(runs, CURRENT_USER_ID, e.trailId)
        const diff = mine !== undefined ? e.timeSec - mine : undefined
        const faster = diff !== undefined && diff < 0
        const inner = (
          <>
            <span className="cr-glyph">
              <RouteGlyph coords={trail.path} size={44} strokeWidth={2} />
            </span>
            <span className="cr-text">
              <span className="cr-name">{name}</span>
              <span className="survey ell">
                {trail.name}
                {faster ? ' · tap to chase' : ''}
              </span>
            </span>
            <span className="cr-time">
              <b className="num">{formatTime(e.timeSec)}</b>
              {diff !== undefined ? (
                <span className={`sp ${faster ? 'fast' : 'slow'}`}>{formatSplit(diff)}</span>
              ) : (
                <span className="survey">not yet run</span>
              )}
            </span>
          </>
        )
        return (
          <motion.div
            key={e.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
          >
            {faster ? (
              <button
                className="hairline cr-row"
                onClick={() => {
                  setChase({ trailId: e.trailId, userId: e.userId, timeSec: e.timeSec, label: name })
                  navigate(`/record?trail=${e.trailId}`)
                }}
              >
                {inner}
              </button>
            ) : (
              <Link to={`/trail/${e.trailId}`} className="hairline cr-row">
                {inner}
              </Link>
            )}
          </motion.div>
        )
      })}
    </section>
  )
}
