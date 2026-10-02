import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ElevationProfile } from '../components/ElevationProfile'
import { TrailMap } from '../components/TrailMap'
import { getTrail, trails, type ConditionTag } from '../data/seed'
import { formatDelta, formatTime } from '../lib/format'
import { bestTime, useAppStore } from '../store/useAppStore'

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

  const [finishing, setFinishing] = useState(false)
  const [tags, setTags] = useState<ConditionTag[]>(['Dry'])
  const [note, setNote] = useState('')

  const activeChase = recording?.chase ?? (chase?.trailId === trail.id ? chase : undefined)
  const pb = bestTime(runs, 'you', trail.id)
  const targetSec = activeChase?.timeSec ?? pb ?? trail.typicalMin * 60

  useEffect(() => {
    if (!recording || recording.paused) return
    const id = window.setInterval(() => tickRecording(), 250)
    return () => clearInterval(id)
  }, [recording?.paused, recording?.trailId, tickRecording])

  const elapsedSec = (recording?.elapsedMs ?? 0) / 1000
  const progress = targetSec > 0 ? Math.min(1, elapsedSec / Math.max(targetSec, 1)) : 0
  // Simulate your position advancing with time vs distance proxy
  const youProgress = Math.min(0.98, elapsedSec / (trail.typicalMin * 60))
  const ghostProgress = Math.min(0.98, elapsedSec / targetSec)

  const delta = useMemo(() => {
    // Positive = behind ghost
    const expectedYou = youProgress * targetSec
    return elapsedSec - expectedYou
  }, [elapsedSec, youProgress, targetSec])

  const ring = 100
  const circumference = 2 * Math.PI * 42
  const ringOffset = circumference * (1 - Math.min(1, progress))

  const demoTimeSec = Math.max(
    60,
    Math.round((activeChase?.timeSec ?? pb ?? trail.typicalMin * 60) * 0.97),
  )
  const useDemoTime = elapsedSec < 120

  if (finishing && recording) {
    const saveSec = useDemoTime ? demoTimeSec : Math.round(elapsedSec)
    return (
      <div className="page" style={{ padding: '20px 16px calc(var(--dock-h) + 24px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: 28,
            padding: 20,
            background: 'rgba(250,252,251,0.96)',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
            Finish hike
          </p>
          <h1 className="display" style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 6 }}>
            {trail.name}
          </h1>
          <p className="display pb-gold" style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8 }}>
            {formatTime(saveSec)}
          </p>
          {useDemoTime && (
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Short demo session — saving a realistic pace vs your ghost target.
            </p>
          )}

          <p style={{ fontWeight: 700, marginTop: 20, marginBottom: 8 }}>Trail conditions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['Dry', 'Muddy', 'Snow', 'Icy', 'Bugs', 'Busy'] as ConditionTag[]).map((tag) => (
              <button
                key={tag}
                className={`chip ${tags.includes(tag) ? 'active' : ''}`}
                onClick={() =>
                  setTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                  )
                }
              >
                {tag}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for your crew…"
            rows={3}
            style={{
              width: '100%',
              marginTop: 14,
              borderRadius: 12,
              border: '1px solid var(--line)',
              padding: 12,
              background: 'white',
            }}
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 14 }}
            onClick={() => {
              const adjustSec = useDemoTime ? demoTimeSec - Math.round(elapsedSec) : 0
              const result = finishRecording({
                conditions: tags,
                note: note || undefined,
                adjustSec,
              })
              setFinishing(false)
              if (result) navigate('/result')
            }}
          >
            Save & see result
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setFinishing(false)}>
            Back to timer
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'relative', height: '100dvh' }}>
        <TrailMap
          trails={[trail]}
          selectedId={trail.id}
          focus={trail.center}
          zoom={12.4}
          route={trail.path}
          youProgress={recording ? youProgress : 0}
          ghostProgress={recording ? ghostProgress : undefined}
          interactive={false}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(16,32,30,0.35) 0%, transparent 28%, transparent 55%, rgba(16,32,30,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Link to={`/trail/${trail.id}`} className="btn btn-ghost" style={{ padding: '10px 14px' }}>
            ← {trail.name}
          </Link>
          {activeChase && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                background: 'rgba(251,191,36,0.92)',
                color: '#10201e',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Ghost · {activeChase.label}
            </div>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            padding: '0 16px calc(var(--dock-h) + 20px)',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto',
              borderRadius: 28,
              background: 'var(--glass)',
              border: '1px solid rgba(255,255,255,0.65)',
              backdropFilter: 'blur(18px)',
              boxShadow: 'var(--shadow)',
              padding: 18,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto' }}>
                <svg className="progress-ring" width="110" height="110" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(16,32,30,0.08)" strokeWidth="8" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={delta <= 0 ? '#0a8a82' : '#d97706'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: ringOffset }}
                    initial={false}
                    style={{ strokeDashoffset: ring }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <p className="display" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    {formatTime(elapsedSec)}
                  </p>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  {recording ? (recording.paused ? 'Paused' : 'Live') : 'Ready'}
                </p>
                <p className="display" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 2 }}>
                  {recording
                    ? delta <= 0
                      ? `${formatDelta(delta)} ahead`
                      : `${formatDelta(delta)} behind`
                    : activeChase
                      ? `Chase ${formatTime(targetSec)}`
                      : pb
                        ? `Beat ${formatTime(pb)}`
                        : 'First ascent'}
                </p>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Target {formatTime(targetSec)}
                  {activeChase ? ` · ${activeChase.label}` : pb ? ' · your PB' : ' · typical'}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <ElevationProfile
                elevation={trail.elevation}
                progress={recording ? youProgress : undefined}
                ghostProgress={recording ? ghostProgress : undefined}
                height={88}
              />
            </div>

            <div className="btn-row" style={{ marginTop: 12 }}>
              {!recording && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => startRecording(trail.id, activeChase)}
                >
                  Start
                </button>
              )}
              {recording && !recording.paused && (
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={pauseRecording}>
                  Pause
                </button>
              )}
              {recording?.paused && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={resumeRecording}>
                  Resume
                </button>
              )}
              {recording && (
                <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => setFinishing(true)}>
                  Finish
                </button>
              )}
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 10, textAlign: 'center' }}>
              Web prototype timer with ghost pacing. Native GPS tracking comes later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
