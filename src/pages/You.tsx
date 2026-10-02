import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getTrail, trails } from '../data/trails'
import { formatGain, formatKm, formatTime } from '../lib/format'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

export function You() {
  const runs = useAppStore((s) => s.runs)
  const ageBracket = useAppStore((s) => s.ageBracket)
  const experience = useAppStore((s) => s.experience)
  const chase = useAppStore((s) => s.chase)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)

  const yourRuns = runs.filter((r) => r.userId === 'you')
  const totalKm = yourRuns.reduce((sum, r) => sum + (getTrail(r.trailId)?.distKm ?? 0), 0)
  const totalGain = yourRuns.reduce((sum, r) => sum + (getTrail(r.trailId)?.gainM ?? 0), 0)
  const pbCount = trails.filter((t) => bestTime(runs, 'you', t.id) !== undefined).length

  const trailStats = trails
    .map((t) => {
      const pb = bestTime(runs, 'you', t.id)
      if (!pb) return null
      const board = leaderboard(runs, t.id)
      const rank = board.findIndex((x) => x.userId === 'you') + 1
      return { trail: t, pb, rank }
    })
    .filter(Boolean) as { trail: (typeof trails)[0]; pb: number; rank: number }[]

  return (
    <div className="page page-pad">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Progress
        </p>
        <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 10vw, 3rem)', fontWeight: 800, lineHeight: 0.95, marginTop: 4 }}>
          You
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {ageBracket} · {experience} · {joinedCrewIds.length} crew{joinedCrewIds.length === 1 ? '' : 's'}
        </p>
      </motion.div>

      <div className="stat-grid" style={{ marginTop: 20, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <BigStat label="Hikes" value={String(yourRuns.length)} />
        <BigStat label="Distance" value={formatKm(totalKm)} />
        <BigStat label="Climbed" value={formatGain(totalGain)} />
        <BigStat label="Trails with PB" value={String(pbCount)} gold />
      </div>

      {chase && (
        <Link
          to={`/trail/${chase.trailId}`}
          style={{
            display: 'block',
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(10,138,130,0.12))',
            border: '1px solid var(--line)',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
            Active chase
          </p>
          <p className="display" style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>
            {getTrail(chase.trailId)?.name}
          </p>
          <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>
            vs {chase.label} · {formatTime(chase.timeSec)}
          </p>
        </Link>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Per-trail bests</h2>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {trailStats.map(({ trail, pb, rank }, i) => (
            <motion.div
              key={trail.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/trail/${trail.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 800 }}>{trail.name}</p>
                  <p className="muted" style={{ fontSize: 13 }}>Rank #{rank || '—'}</p>
                </div>
                <p className="display pb-gold" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {formatTime(pb)}
                </p>
              </Link>
            </motion.div>
          ))}
          {!trailStats.length && <p className="muted">Log a hike to start your timeline.</p>}
        </div>
      </section>

      <section style={{ marginTop: 28, marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent activity</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {yourRuns.slice(0, 8).map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 700 }}>{getTrail(r.trailId)?.name}</span>
              <span className="pb-gold" style={{ fontWeight: 800 }}>{formatTime(r.timeSec)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function BigStat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="stat-tile" style={{ padding: 16, textAlign: 'left' }}>
      <div className="l">{label}</div>
      <div className={`v ${gold ? 'pb-gold' : ''}`} style={{ fontSize: '1.5rem', marginTop: 4 }}>
        {value}
      </div>
    </div>
  )
}
