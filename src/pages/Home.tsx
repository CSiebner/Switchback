import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getHiker, getTrail, trails } from '../data/seed'
import { formatGain, formatKm, formatTime, relativeTime } from '../lib/format'
import { RouteSketch } from '../components/RouteSketch'
import { bestTime, useAppStore } from '../store/useAppStore'

export function Home() {
  const runs = useAppStore((s) => s.runs)
  const chase = useAppStore((s) => s.chase)
  const feed = useAppStore((s) => s.feed)
  const savedTrailIds = useAppStore((s) => s.savedTrailIds)

  const yourTrails = trails.filter(
    (t) => savedTrailIds.includes(t.id) || runs.some((r) => r.userId === 'you' && r.trailId === t.id),
  )
  const chaseTrail = chase ? getTrail(chase.trailId) : undefined
  const yourChaseBest = chase ? bestTime(runs, 'you', chase.trailId) : undefined
  const gap = yourChaseBest !== undefined && chase ? yourChaseBest - chase.timeSec : undefined

  return (
    <div className="page">
      <section
        style={{
          position: 'relative',
          minHeight: '72dvh',
          overflow: 'hidden',
          borderRadius: '0 0 32px 32px',
          background:
            'linear-gradient(165deg, #0d4f4a 0%, #0a8a82 42%, #1a6b5c 70%, #c4841d 140%)',
          color: 'white',
          padding: '28px 22px 32px',
        }}
      >
        <TerrainBackdrop />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <p
            className="display"
            style={{
              fontSize: 'clamp(2.8rem, 12vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
            }}
          >
            Switchback
          </p>
          <p style={{ marginTop: 14, maxWidth: 320, fontSize: 16, lineHeight: 1.45, opacity: 0.92 }}>
            Beat yourself on the trail. Share the progress with your crew.
          </p>

          {chase && chaseTrail && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              style={{
                marginTop: 28,
                padding: 16,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75 }}>
                    Active chase
                  </p>
                  <p className="display" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 4 }}>
                    {chaseTrail.name}
                  </p>
                  <p style={{ fontSize: 14, opacity: 0.9, marginTop: 2 }}>
                    vs {chase.label} · {formatTime(chase.timeSec)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>YOUR BEST</p>
                  <p className="display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
                    {yourChaseBest ? formatTime(yourChaseBest) : '—'}
                  </p>
                  {gap !== undefined && (
                    <p style={{ fontSize: 13, fontWeight: 700 }}>
                      {gap > 0 ? `${formatTime(gap)} behind` : 'Ahead!'}
                    </p>
                  )}
                </div>
              </div>
              <div className="btn-row" style={{ marginTop: 14 }}>
                <Link to={`/record?trail=${chase.trailId}`} className="btn btn-gold" style={{ flex: 1, textAlign: 'center' }}>
                  Start ghost run
                </Link>
                <Link to={`/trail/${chase.trailId}`} className="btn btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}>
                  Trail
                </Link>
              </div>
            </motion.div>
          )}

          {!chase && (
            <div className="btn-row" style={{ marginTop: 28 }}>
              <Link to="/explore" className="btn btn-gold">
                Find a trail to chase
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      <section className="page-pad" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Your trails</h2>
            <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>Progress first — discovery second.</p>
          </div>
          <Link to="/explore" style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 14 }}>
            Explore
          </Link>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {yourTrails.map((trail, i) => {
            const pb = bestTime(runs, 'you', trail.id)
            return (
              <motion.div
                key={trail.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  to={`/trail/${trail.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr',
                    gap: 14,
                    padding: 12,
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid var(--line)',
                    alignItems: 'center',
                  }}
                >
                  <RouteSketch trail={trail} />
                  <div>
                    <p style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                      {trail.name}
                    </p>
                    <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {trail.difficulty} · {formatKm(trail.distKm)} · {formatGain(trail.gainM)}
                    </p>
                    <p style={{ marginTop: 6, fontWeight: 700 }}>
                      PB{' '}
                      <span className="pb-gold">{pb ? formatTime(pb) : '— log a hike'}</span>
                    </p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="page-pad" style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Crew pulse</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 2, marginBottom: 12 }}>
          Recording data that becomes community signal.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {feed.slice(0, 3).map((item) => {
            const user = getHiker(item.userId)
            const trail = item.trailId ? getTrail(item.trailId) : undefined
            return (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontWeight: 700 }}>
                    {user?.name}
                    {item.type === 'pb' && (
                      <span style={{ marginLeft: 8, color: 'var(--gold)', fontSize: 12 }}>NEW PB</span>
                    )}
                  </p>
                  <span className="muted" style={{ fontSize: 12 }}>{relativeTime(item.timestamp)}</span>
                </div>
                <p style={{ marginTop: 4, fontSize: 14, lineHeight: 1.4 }}>{item.text}</p>
                {trail && (
                  <p className="muted" style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                    {trail.name}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <Link to="/crews" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
          Open crews
        </Link>
      </section>
    </div>
  )
}

function TerrainBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMax slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
    >
      <motion.path
        d="M0 320 L60 260 L110 290 L170 180 L230 240 L290 120 L340 190 L400 140 L400 500 L0 500 Z"
        fill="rgba(0,0,0,0.25)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M0 380 L80 300 L140 340 L200 250 L280 310 L360 220 L400 260 L400 500 L0 500 Z"
        fill="rgba(251,191,36,0.18)"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1 }}
      />
      <motion.circle
        cx="290"
        cy="120"
        r="5"
        fill="#fbbf24"
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      />
    </svg>
  )
}
