import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Split, formatSplit } from '../components/Split'
import { RouteGlyph } from '../components/RouteGlyph'
import { getTrail } from '../data/trails'
import { getHiker } from '../data/seed'
import { formatTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { projectToBox, smoothPath } from '../lib/geo'
import { useDusk } from '../lib/useMood'
import { leaderboard, useAppStore } from '../store/useAppStore'

type Stage = 'replay' | 'split' | 'rank' | 'poster'

export function Result() {
  // Snapshot on mount: clearing the store result mid-navigation must not yank this screen away.
  const [result] = useState(() => useAppStore.getState().lastResult)
  const runs = useAppStore((s) => s.runs)
  const crews = useAppStore((s) => s.crews)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const clearResult = useAppStore((s) => s.clearResult)
  const setChase = useAppStore((s) => s.setChase)
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('replay')

  useDusk(true)

  useEffect(() => {
    const t1 = setTimeout(() => setStage('split'), 2600)
    const t2 = setTimeout(() => setStage('rank'), 4400)
    const t3 = setTimeout(() => setStage('poster'), 6000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  if (!result) return <Navigate to="/" replace />

  const trail = getTrail(result.trailId)
  if (!trail) return <Navigate to="/" replace />

  const refSec = result.chase?.timeSec ?? result.previousBest ?? trail.typicalMin * 60
  const splitSec = result.timeSec - refSec
  const refLabel = result.chase?.label ?? (result.previousBest ? 'your best' : 'typical pace')

  const board = leaderboard(runs, trail.id)
  const youIdx = board.findIndex((r) => r.userId === 'you')
  const passed = result.rankBefore && result.rankAfter && result.rankAfter < result.rankBefore
    ? board.slice(result.rankAfter, result.rankBefore).map((r) => getHiker(r.userId)?.name).filter(Boolean)
    : []
  const crew = crews.find((c) => joinedCrewIds.includes(c.id))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--spruce-950)', color: 'var(--rock-flour)', position: 'relative', overflowY: 'auto' }}>
      <ContourBackdrop coords={trail.path} />

      <div className="container" style={{ position: 'relative', padding: 'calc(var(--brand-h) + 12px) 20px calc(32px + env(safe-area-inset-bottom))', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="survey">{trail.name} · {formatTime(result.timeSec)}</p>
          <button
            className="survey"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--scree)' }}
            onClick={() => setStage('poster')}
          >
            skip
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {stage === 'replay' && (
              <motion.div key="replay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Replay coords={trail.path} youSec={result.timeSec} ghostSec={refSec} />
                <p className="survey" style={{ textAlign: 'center', marginTop: 16 }}>
                  you vs {refLabel}
                </p>
              </motion.div>
            )}

            {(stage === 'split' || stage === 'rank' || stage === 'poster') && (
              <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'left' }}>
                <Split seconds={splitSec} slam size="result" />
                <p style={{ marginTop: 14, fontSize: 'var(--type-lg)', fontWeight: 700, color: 'var(--rock-flour)' }}>
                  {splitSec <= 0 ? 'ahead of' : 'behind'} {refLabel}
                </p>
                {stage === 'poster' && <EffortLine distKm={trail.distKm} elevation={trail.elevation} timeSec={result.timeSec} />}

                {result.isPb && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: 8, color: 'var(--larch-hi)', fontWeight: 800, fontSize: 'var(--type-md)' }}
                  >
                    Personal best on {trail.name}
                  </motion.p>
                )}

                {(stage === 'rank' || stage === 'poster') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ marginTop: 28 }}
                  >
                    <Ladder board={board} youIdx={youIdx} rankBefore={result.rankBefore} />
                    {passed.length > 0 && (
                      <p style={{ marginTop: 12, fontWeight: 700, color: 'var(--larch-hi)' }}>
                        You passed {passed.length > 1 ? `${passed.slice(0, -1).join(', ')} and ${passed[passed.length - 1]}` : passed[0]}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {stage === 'poster' && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--contour-dark)' }}>
                <RouteGlyph coords={trail.path} size={56} stroke={splitSec <= 0 ? '#f5b544' : '#2fd4c4'} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800 }}>{trail.name}</p>
                  <p className="survey num">
                    {formatTime(result.timeSec)} · {formatSplit(splitSec)} · {trail.distKm.toFixed(1)} km · {Math.round(trail.gainM)} m ↑
                  </p>
                </div>
              </div>
              <Splits distKm={trail.distKm} elevation={trail.elevation} timeSec={result.timeSec} />
              <div className="btn-row" style={{ marginTop: 10 }}>
                <Link
                  to="/crews"
                  className="btn btn-larch"
                  style={{ flex: 1 }}
                  onClick={() => clearResult()}
                >
                  Send to {crew?.name ?? 'crew'}
                </Link>
              </div>
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setChase({
                      trailId: trail.id,
                      userId: 'you',
                      timeSec: Math.round(result.timeSec * 0.99),
                      label: 'your next target',
                    })
                    clearResult()
                    navigate(`/record?trail=${trail.id}`)
                  }}
                >
                  Set next ghost −1%
                </button>
                <Link to={`/trail/${trail.id}`} className="btn btn-ghost" onClick={() => clearResult()}>
                  Trail
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Splits({ distKm, elevation, timeSec }: { distKm: number; elevation: number[]; timeSec: number }) {
  const e = effortFor({ distKm, elevation }, timeSec)
  const max = Math.max(...e.splits.map((s) => s.sec))
  const kcal = Math.round((timeSec / 3600) * 420 + e.ascentM * 0.15)
  return (
    <div style={{ marginTop: 8, paddingTop: 8 }}>
      <p className="survey">Splits · {kcal.toLocaleString()} kcal</p>
      {e.splits.map((s) => (
        <div key={s.km} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 64px', gap: 10, alignItems: 'center', marginTop: 8 }}>
          <span className="num" style={{ fontWeight: 700 }}>{s.km}</span>
          <span style={{ height: 8, borderRadius: 99, background: 'rgba(228,238,235,0.12)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${(s.sec / max) * 100}%`, background: 'var(--glacier-glow)' }} />
          </span>
          <span className="num survey" style={{ textAlign: 'right' }}>{formatTime(s.sec)} · {s.gainM}m</span>
        </div>
      ))}
    </div>
  )
}

function EffortLine({ distKm, elevation, timeSec }: { distKm: number; elevation: number[]; timeSec: number }) {
  const e = effortFor({ distKm, elevation }, timeSec)
  const cells = [
    { v: formatPace(e.paceSecPerKm), l: '/km' },
    { v: formatPace(e.gapSecPerKm), l: 'grade pace' },
    { v: e.ascentPaceSec ? formatPace(e.ascentPaceSec) : '—', l: '/100m up' },
    { v: e.descentPaceSec ? formatPace(e.descentPaceSec) : '—', l: '/100m down' },
    { v: e.steps.toLocaleString(), l: 'steps' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 8px', marginTop: 16 }}>
      {cells.map((c) => (
        <div key={c.l}>
          <p className="num" style={{ fontWeight: 800, fontSize: 13, color: 'var(--rock-flour)' }}>{c.v}</p>
          <p className="survey" style={{ marginTop: 2 }}>{c.l}</p>
        </div>
      ))}
    </div>
  )
}

function Replay({ coords, youSec, ghostSec }: { coords: [number, number][]; youSec: number; ghostSec: number }) {
  const size = 320
  const pts = useMemo(() => projectToBox(coords, size, size, 24), [coords])
  const d = useMemo(() => smoothPath(pts), [pts])
  const youWins = youSec <= ghostSec
  const duration = 2.2
  const youDur = youWins ? duration * (youSec / ghostSec) : duration
  const ghostDur = youWins ? duration : duration * (ghostSec / youSec)

  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 360 }} fill="none">
        <motion.path
          d={d}
          stroke="rgba(228,238,235,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d={d}
          stroke="#f5b544"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: ghostDur, delay: 0.5, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(245,181,68,0.7))' }}
        />
        <motion.path
          d={d}
          stroke="#2fd4c4"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: youDur, delay: 0.5, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 10px rgba(47,212,196,0.8))' }}
        />
      </svg>
    </div>
  )
}

function Ladder({
  board,
  youIdx,
  rankBefore,
}: {
  board: { userId: string; timeSec: number }[]
  youIdx: number
  rankBefore?: number
}) {
  const rows = board.slice(Math.max(0, youIdx - 1), youIdx + 2)
  const startRank = Math.max(0, youIdx - 1) + 1
  return (
    <div>
      {rows.map((r, i) => {
        const rank = startRank + i
        const you = r.userId === 'you'
        return (
          <motion.div
            key={r.userId}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderTop: '1px solid var(--contour-dark)',
              color: you ? 'var(--larch-hi)' : 'var(--rock-flour)',
            }}
          >
            <span className="display num" style={{ fontSize: 'var(--type-lg)', fontWeight: 800 }}>
              #{rank}
              {you && rankBefore && rankBefore !== rank ? (
                <span className="survey" style={{ marginLeft: 6, color: 'var(--scree)' }}>
                  ←{rankBefore}
                </span>
              ) : null}
            </span>
            <span style={{ fontWeight: you ? 800 : 600 }}>{you ? 'You' : getHiker(r.userId)?.name}</span>
            <span className="num" style={{ fontWeight: 700 }}>
              {formatTime(r.timeSec)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function ContourBackdrop({ coords }: { coords: [number, number][] }) {
  const size = 400
  const pts = useMemo(() => projectToBox(coords, size, size, 40), [coords])
  const d = useMemo(() => smoothPath(pts), [pts])
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
      fill="none"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={d}
          stroke="rgba(47,212,196,0.08)"
          strokeWidth={1}
          transform={`translate(${(i - 2.5) * 14}, ${(i - 2.5) * 10}) scale(${1 + i * 0.12})`}
          style={{ transformOrigin: 'center' }}
        />
      ))}
    </svg>
  )
}
