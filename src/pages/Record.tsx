import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TrailMap } from '../components/TrailMap'
import { formatSplit } from '../components/Split'
import { HoldButton } from '../components/HoldButton'
import { StatMark } from '../components/StatMark'
import { ElevationProfile } from '../components/ElevationProfile'
import { getTrail, trails } from '../data/trails'
import type { ConditionTag } from '../data/seed'
import { formatTime } from '../lib/format'
import { formatPace } from '../lib/effort'
import { snapToPath } from '../lib/geo'
import { useDusk } from '../lib/useMood'
import { bestTime, useAppStore } from '../store/useAppStore'

const CONDITIONS: { tag: ConditionTag; glyph: string }[] = [
  { tag: 'Dry', glyph: '☀' },
  { tag: 'Muddy', glyph: '≋' },
  { tag: 'Snow', glyph: '✱' },
  { tag: 'Icy', glyph: '◈' },
  { tag: 'Bugs', glyph: '⁂' },
  { tag: 'Busy', glyph: '⁝⁝' },
]

export function Record() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const trailId = params.get('trail') ?? useAppStore.getState().chase?.trailId ?? 'ha-ling'
  const trail = getTrail(trailId) ?? trails[1]

  const recording = useAppStore((s) => s.recording)
  const chase = useAppStore((s) => s.chase)
  const runs = useAppStore((s) => s.runs)
  const startRecording = useAppStore((s) => s.startRecording)
  const pauseRecording = useAppStore((s) => s.pauseRecording)
  const resumeRecording = useAppStore((s) => s.resumeRecording)
  const tickRecording = useAppStore((s) => s.tickRecording)
  const finishRecording = useAppStore((s) => s.finishRecording)
  const packed = useAppStore((s) => s.packedTrailIds)

  const [finishing, setFinishing] = useState(false)
  const [tags, setTags] = useState<ConditionTag[]>(['Dry'])
  const [gps, setGps] = useState<{ t: number; offM: number } | null>(null)

  useDusk(true)

  const optedIn = params.get('against') === '1'
  const activeChase = recording?.chase ?? (optedIn && chase?.trailId === trail.id ? chase : undefined)
  const pb = bestTime(runs, 'you', trail.id)
  const targetSec = activeChase?.timeSec ?? pb ?? trail.typicalMin * 60
  const usingGps = gps !== null && gps.offM < 400

  useEffect(() => {
    if (!recording || recording.paused) return
    const id = window.setInterval(() => tickRecording(), 200)
    return () => clearInterval(id)
  }, [recording?.paused, recording?.trailId, tickRecording])

  useEffect(() => {
    if (!recording || recording.paused || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const snap = snapToPath(trail.path, [pos.coords.longitude, pos.coords.latitude])
        setGps(snap.offM < 800 ? snap : null)
      },
      () => setGps(null),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [recording?.paused, recording?.trailId, trail.path])

  const elapsedSec = (recording?.elapsedMs ?? 0) / 1000
  // Demo accelerator: 1 real second = 60 trail seconds so the HUD comes alive in a demo.
  const demoScale = 60
  // The saved demo time is 3% under target, so "you" are paced to finish exactly then.
  const demoTimeSec = Math.max(60, Math.round(targetSec * 0.97))
  // Hold at the summit once the demo run arrives (keeps the split honest if the user lingers).
  const trailSec = usingGps ? elapsedSec : Math.min(elapsedSec * demoScale, demoTimeSec)
  // Narrative pacing when GPS is quiet: start a touch behind, reel it in.
  const x = Math.min(1, trailSec / demoTimeSec)
  const youProgress = usingGps ? Math.min(0.995, gps!.t) : Math.min(0.995, x - 0.035 * Math.sin(Math.PI * x))
  const ghostProgress = Math.min(0.995, (usingGps ? elapsedSec : trailSec) / targetSec)

  const split = useMemo(() => {
    // Positive = behind. Time it would take ghost to reach your current position vs your elapsed.
    const ghostTimeAtYou = youProgress * targetSec
    return trailSec - ghostTimeAtYou
  }, [trailSec, youProgress, targetSec])
  if (finishing && recording) {
    return (
      <div className="page" style={{ padding: '24px 20px calc(24px + env(safe-area-inset-bottom))', minHeight: '100dvh' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container">
          <p className="survey">{trail.name} · {formatTime(demoTimeSec)}</p>
          <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 10, lineHeight: 0.95 }}>
            What were the conditions?
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 24 }}>
            {CONDITIONS.map(({ tag, glyph }) => {
              const on = tags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                  }
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--r-lg)',
                    border: `1px solid ${on ? 'var(--larch)' : 'var(--contour-dark)'}`,
                    background: on ? 'rgba(245,181,68,0.14)' : 'rgba(228,238,235,0.04)',
                    color: on ? 'var(--larch-hi)' : 'var(--rock-flour)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{glyph}</span>
                  <span style={{ fontWeight: 700, fontSize: 'var(--type-sm)' }}>{tag}</span>
                </button>
              )
            })}
          </div>
          <button
            className="btn btn-larch"
            style={{ width: '100%', marginTop: 28, padding: '20px' }}
            onClick={() => {
              const adjustSec = usingGps ? 0 : demoTimeSec - Math.round(elapsedSec)
              const result = finishRecording({ conditions: tags, adjustSec })
              setFinishing(false)
              if (result) navigate('/result')
            }}
          >
            See how you did
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => setFinishing(false)}>
            Back
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: 'var(--spruce-950)' }}>
      <TrailMap
        trails={[]}
        route={trail.path}
        youProgress={recording ? youProgress : 0}
        ghostProgress={recording ? ghostProgress : undefined}
        mood="dusk"
        pitch={recording ? 62 : 48}
        follow={!!recording && !recording.paused}
        fit={!recording}
        fitPadding={{ top: 200, bottom: 260, left: 40, right: 40 }}
        interactive={false}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(11,23,22,0.85) 0%, rgba(11,23,22,0.25) 30%, rgba(11,23,22,0) 50%, rgba(11,23,22,0.55) 78%, rgba(11,23,22,0.95) 100%)',
        }}
      />

      <div style={{ position: 'absolute', top: 'calc(var(--brand-h) + 8px)', left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/trail/${trail.id}`} className="btn btn-ghost" style={{ padding: '10px 14px', fontSize: 'var(--type-sm)' }}>
          ← {trail.name}
        </Link>
        <span className="survey" style={{ color: 'var(--scree)' }}>
          {recording ? (recording.paused ? 'Paused' : usingGps ? 'GPS' : 'Practice') : 'Ready'}
        </span>
      </div>

      <div style={{ position: 'absolute', top: 'calc(var(--brand-h) + 64px)', left: 20, right: 20 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {recording ? (
            <>
              <p className="display num" style={{ fontSize: 'clamp(2.4rem, 10vw, 3.2rem)', fontWeight: 800, color: 'var(--rock-flour)', lineHeight: 1 }}>
                {(youProgress * trail.distKm).toFixed(1)} km
              </p>
              <p style={{ marginTop: 8, fontWeight: 700, color: 'var(--rock-flour)' }}>
                {Math.round(youProgress * trail.gainM)} m climbed · {Math.round(Math.max(0, 1 - youProgress) * trail.gainM)} m to the summit
              </p>
              <p className="survey num" style={{ marginTop: 6 }}>
                {formatTime(trailSec)} · {formatPace(trailSec / Math.max(0.1, youProgress * trail.distKm))}/km
                {activeChase ? ` · ${formatSplit(split)} vs ${activeChase.label}` : ''}
              </p>
              <p className="survey num" style={{ marginTop: 4 }}>
                {usingGps && gps && gps.offM > 35
                  ? `Off the trail · ${Math.round(gps.offM)} m`
                  : `On the trail · ${(Math.max(0, 1 - youProgress) * trail.distKm).toFixed(1)} km · ${Math.round(Math.max(0, 1 - youProgress) * trail.gainM)} m to the summit`}
                {usingGps ? ' · GPS' : ''}
                {packed.includes(trail.id) ? ' · saved on this phone' : ''}
              </p>
            </>
          ) : (
            <>
              <p className="survey">
                {activeChase ? `Racing ${activeChase.label}` : pb ? 'Against your best time' : 'A typical time for this trail'}
              </p>
              <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 8, lineHeight: 0.95, color: 'var(--rock-flour)' }}>
                {formatTime(targetSec)}
              </h1>
              <p className="stat-inline light" style={{ marginTop: 10 }}>
                <span><StatMark kind="distance" />{trail.distKm.toFixed(1)} km</span>
                <span><StatMark kind="climb" />{Math.round(trail.gainM)} m</span>
                <span>{trail.region}</span>
              </p>
              <p className="survey" style={{ marginTop: 8 }}>Teal is you. Gold is the time you are measuring against.</p>
              <p className="survey" style={{ marginTop: 4 }}>Practice replays the trail on this phone. On the trail, it follows your GPS.</p>
            </>
          )}
        </motion.div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px calc(28px + env(safe-area-inset-bottom))' }}>
        <div className="container">
          <div style={{ opacity: 0.95 }}>
            <ElevationProfile
              elevation={trail.elevation}
              progress={recording ? youProgress : undefined}
              ghostProgress={recording ? ghostProgress : undefined}
              height={72}
              dusk
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 18 }}>
            <AnimatePresence mode="wait">
              {!recording && (
                <motion.div key="start" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <button
                    className="btn btn-larch"
                    style={{ padding: '22px 44px', fontSize: 'var(--type-lg)' }}
                    onClick={() => startRecording(trail.id, optedIn ? activeChase : undefined)}
                  >
                    Start the hike
                  </button>
                </motion.div>
              )}
              {recording && (
                <motion.div
                  key="live"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 28 }}
                >
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '14px 18px' }}
                    onClick={() => (recording.paused ? resumeRecording() : pauseRecording())}
                  >
                    {recording.paused ? 'Resume' : 'Pause'}
                  </button>
                  <HoldButton
                    label="HOLD"
                    onComplete={() => {
                      pauseRecording()
                      setFinishing(true)
                    }}
                    icon={
                      <span style={{ textAlign: 'center', lineHeight: 1.05 }}>
                        <span style={{ display: 'block', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em' }}>HOLD</span>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 11, color: 'var(--scree-dark)' }}>finish</span>
                      </span>
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
