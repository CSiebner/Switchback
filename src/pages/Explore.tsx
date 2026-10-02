import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TrailMap } from '../components/TrailMap'
import { RouteSketch } from '../components/RouteSketch'
import { type Difficulty } from '../data/seed'
import { trails } from '../data/trails'
import { formatGain, formatKm, formatTime, relativeTime, conditionConfidence } from '../lib/format'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

const filters: Array<Difficulty | 'All'> = ['All', 'Easy', 'Moderate', 'Hard']

export function Explore() {
  const navigate = useNavigate()
  const [diff, setDiff] = useState<Difficulty | 'All'>('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const runs = useAppStore((s) => s.runs)
  const conditions = useAppStore((s) => s.conditions)

  const filtered = useMemo(() => {
    return trails.filter((t) => {
      if (diff !== 'All' && t.difficulty !== diff) return false
      if (query && !`${t.name} ${t.region}`.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [diff, query])

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0]
  const pb = selected ? bestTime(runs, 'you', selected.id) : undefined
  const rank = selected
    ? leaderboard(runs, selected.id).findIndex((r) => r.userId === 'you') + 1
    : 0
  const fresh = selected
    ? conditions
        .filter((c) => c.trailId === selected.id)
        .map((c) => ({ c, conf: conditionConfidence(c.timestamp, c.confirms) }))
        .filter((x) => x.conf >= 0.15)
        .sort((a, b) => b.c.timestamp - a.c.timestamp)[0]
    : undefined

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'relative', height: '100dvh', maxHeight: '100dvh' }}>
        <TrailMap
          trails={filtered}
          selectedId={selected?.id}
          onSelect={(id) => setSelectedId(id)}
          route={selected?.path}
          mood="day"
          pitch={40}
          fitPadding={{ top: 140, bottom: 320, left: 40, right: 40 }}
          pinClass={(t) => {
            const board = leaderboard(runs, t.id)
            if (board[0]?.userId === 'you') return 'pb'
            if (bestTime(runs, 'you', t.id) !== undefined) return 'done'
            return ''
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '16px 16px 0',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto', maxWidth: 480, margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: 8,
                borderRadius: 18,
                background: 'var(--glass)',
                border: '1px solid rgba(255,255,255,0.7)',
                backdropFilter: 'blur(14px)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Bow Valley trails"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  padding: '10px 12px',
                  fontWeight: 600,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {filters.map((f) => (
                <button
                  key={f}
                  className={`chip ${diff === f ? 'active' : ''} ${f !== 'All' ? `diff-${f.toLowerCase()}` : ''}`}
                  onClick={() => setDiff(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              className="sheet"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 3,
                padding: '0 18px calc(var(--dock-h) + 28px)',
                maxWidth: 480,
                margin: '0 auto',
              }}
            >
              <div className="sheet-handle" />
              <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12, alignItems: 'center' }}>
                <RouteSketch trail={selected} height={72} />
                <div>
                  <p className="display" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    {selected.name}
                  </p>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {selected.region} · {selected.difficulty} · {formatKm(selected.distKm)} · {formatGain(selected.gainM)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, fontWeight: 700 }}>
                <span>
                  PB <span className="pb-gold">{pb ? formatTime(pb) : '—'}</span>
                </span>
                <span className="muted">Rank {rank || '—'}</span>
                <span className="muted">
                  {fresh
                    ? `${fresh.c.tags[0]} · ${relativeTime(fresh.c.timestamp)}`
                    : 'No fresh conditions'}
                </span>
              </div>

              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/trail/${selected.id}`)}>
                  Open trail
                </button>
                <button className="btn btn-gold" onClick={() => navigate(`/record?trail=${selected.id}`)}>
                  Record
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 14, paddingBottom: 4 }}>
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    style={{
                      minWidth: 120,
                      textAlign: 'left',
                      padding: 10,
                      borderRadius: 14,
                      border: t.id === selected.id ? '2px solid var(--teal)' : '1px solid var(--line)',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontWeight: 800, fontSize: 13 }}>{t.name}</p>
                    <p className="muted" style={{ fontSize: 11 }}>{t.difficulty}</p>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 8 }}>
                <Link to={`/trail/${selected.id}`} style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>
                  Reviews & conditions →
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
