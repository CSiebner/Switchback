import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getTrail } from '../data/seed'
import { formatDelta, formatTime } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

export function Result() {
  const result = useAppStore((s) => s.lastResult)
  const clearResult = useAppStore((s) => s.clearResult)
  const navigate = useNavigate()

  if (!result) return <Navigate to="/" replace />

  const trail = getTrail(result.trailId)
  const improvement =
    result.previousBest !== undefined ? result.previousBest - result.timeSec : undefined

  return (
    <div className="page">
      <section
        style={{
          minHeight: '70dvh',
          padding: '36px 22px 28px',
          background: result.isPb
            ? 'linear-gradient(160deg, #0d4f4a 0%, #0a8a82 45%, #b45309 120%)'
            : 'linear-gradient(160deg, #1a2e2c 0%, #0a8a82 70%)',
          color: 'white',
          borderRadius: '0 0 32px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          aria-hidden
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.2 }}
          transition={{ duration: 1.2 }}
          style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: result.isPb ? '#fbbf24' : '#4fd1c5',
            top: -60,
            right: -40,
            filter: 'blur(40px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>
            {trail?.name ?? 'Hike'} · result
          </p>
          <h1 className="display" style={{ fontSize: 'clamp(3rem, 14vw, 4rem)', fontWeight: 800, marginTop: 8, lineHeight: 0.95 }}>
            {formatTime(result.timeSec)}
          </h1>

          {result.isPb ? (
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'inline-block',
                marginTop: 16,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(251,191,36,0.95)',
                color: '#10201e',
                fontWeight: 800,
              }}
            >
              New personal best
            </motion.p>
          ) : (
            <p style={{ marginTop: 16, fontWeight: 700, opacity: 0.9 }}>Logged — chase again soon.</p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginTop: 28,
            }}
          >
            <ResultStat
              label="vs last best"
              value={
                improvement === undefined
                  ? 'First log'
                  : improvement > 0
                    ? formatDelta(-improvement)
                    : formatDelta(-improvement)
              }
            />
            <ResultStat
              label="vs ghost"
              value={
                result.deltaToChase === undefined
                  ? '—'
                  : result.deltaToChase <= 0
                    ? `${formatDelta(result.deltaToChase)} ahead`
                    : `${formatDelta(result.deltaToChase)} behind`
              }
            />
            <ResultStat
              label="Rank"
              value={
                result.rankAfter
                  ? result.rankBefore && result.rankBefore !== result.rankAfter
                    ? `#${result.rankBefore} → #${result.rankAfter}`
                    : `#${result.rankAfter}`
                  : '—'
              }
            />
            <ResultStat label="Trail" value={trail?.difficulty ?? '—'} />
          </div>
        </motion.div>
      </section>

      <section className="page-pad" style={{ marginTop: 8 }}>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
          Every hike becomes community signal — share the result with your crew, or keep hunting the next ghost.
        </p>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <Link to="/crews" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }} onClick={() => clearResult()}>
            Share to crew
          </Link>
          <button
            className="btn btn-gold"
            style={{ flex: 1 }}
            onClick={() => {
              clearResult()
              navigate(`/record?trail=${result.trailId}`)
            }}
          >
            Go again
          </button>
        </div>
        <Link
          to={`/trail/${result.trailId}`}
          className="btn btn-ghost"
          style={{ display: 'block', textAlign: 'center', marginTop: 10 }}
          onClick={() => clearResult()}
        >
          Back to trail
        </Link>
      </section>
    </div>
  )
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.75 }}>
        {label}
      </p>
      <p className="display" style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>
        {value}
      </p>
    </div>
  )
}
