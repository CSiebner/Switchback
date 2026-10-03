import '../styles/trail.css'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { TrailBoard } from '../components/TrailBoard'
import { TrailDirt } from '../components/TrailDirt'
import { TrailElevation } from '../components/TrailElevation'
import { PhotoRail } from '../components/PhotoRail'
import { WeatherWeek } from '../components/WeatherWeek'
import { PackAdvice } from '../components/PackAdvice'
import { LineStars, lineRatingLabel } from '../components/LineStars'
import { Fact } from '../components/StatMark'
import { expectedMin } from '../lib/bodyPlan'
import { TrailStory } from '../components/TrailStory'
import { TrailReviews } from '../components/TrailReviews'
import { TrailMap } from '../components/TrailMap'
import { heroPhoto } from '../data/photos'
import { CURRENT_USER_ID } from '../data/seed'
import { getTrail } from '../data/trails'
import { formatTime } from '../lib/format'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const

function spokenMinutes(min: number) {
  const rounded = Math.max(1, Math.round(min))
  if (rounded < 90) return `${rounded} min`
  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

function plainDuration(sec: number) {
  const minutes = Math.round(sec / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

function percentBucket(place: number, total: number, cuts: number[]): number | null {
  if (place <= 0 || total < 8) return null
  const pct = place / total
  return cuts.find((cut) => pct <= cut / 100) ?? null
}

function TrailBadges({ name, holds, rank, field, attempts, improvedSec }: { name: string; holds: boolean; rank: number; field: number; attempts: number; improvedSec: number }) {
  let text: string | null = null
  const amongHikers = percentBucket(rank, field, [5, 10, 15])
  const amongYours = percentBucket(1, attempts, [5, 10])
  if (improvedSec >= 60) text = `You've cut ${plainDuration(improvedSec)} off your first time on ${name}.`
  else if (attempts >= 2) text = `${attempts} days on ${name}, each one kept with that day's conditions.`
  else if (holds) text = `Your best day on ${name} is still the one to remember.`
  else if (amongYours) text = `This sits among your quicker days on ${name}.`
  else if (amongHikers) text = `Plenty of hikers know ${name}. Your days on it are the record that matters.`
  if (!text) return null
  return (
    <p style={{ margin: '20px 0 0', paddingLeft: 12, borderLeft: '3px solid var(--larch)', fontWeight: 700, lineHeight: 1.4 }}>
      {text}
    </p>
  )
}

function LineRating({ reviews }: { reviews: { rating: number }[] }) {
  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  return (
    <div className="fact">
      <p style={{ margin: 0, minHeight: 18 }} aria-label={reviews.length ? `${avg.toFixed(1)} trail rating` : 'No trail rating yet'}>
        <LineStars value={avg} />
      </p>
      <p className="fact-label">{lineRatingLabel(avg, reviews.length)}</p>
    </div>
  )
}

function CountUp({ value, className }: { value: number; className: string }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => formatTime(v))
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: EASE })
    return () => controls.stop()
  }, [mv, value])
  return (
    <motion.div className={className} aria-label={formatTime(value)}>
      <motion.span>{text}</motion.span>
    </motion.div>
  )
}

export function TrailDetail() {
  const { id = '' } = useParams()
  const trail = getTrail(id)
  const navigate = useNavigate()
  const runs = useAppStore((s) => s.runs)
  const weightKg = useAppStore((s) => s.weightKg)
  const heightCm = useAppStore((s) => s.heightCm)
  const savedTrailIds = useAppStore((s) => s.savedTrailIds)
  const reviews = useAppStore((s) => s.reviews)
  const toggleSaveTrail = useAppStore((s) => s.toggleSaveTrail)

  useEffect(() => {
    if (window.location.hash === '#pack') {
      document.getElementById('pack')?.scrollIntoView({ block: 'start' })
      return
    }
    window.scrollTo(0, 0)
  }, [id])

  const board = useMemo(() => leaderboard(runs, id), [runs, id])
  const pb = bestTime(runs, CURRENT_USER_ID, id)

  if (!trail) {
    return (
      <div className="page page-pad">
        <p>Trail not found.</p>
        <Link to="/explore">Back to explore</Link>
      </div>
    )
  }

  const myIdx = board.findIndex((r) => r.userId === CURRENT_USER_ID)
  const hasRun = pb !== undefined && myIdx >= 0
  const iAmFirst = hasRun && myIdx === 0
  const saved = savedTrailIds.includes(trail.id)

  const mine = runs
    .filter((r) => r.userId === CURRENT_USER_ID && r.trailId === trail.id)
    .sort((a, b) => a.timestamp - b.timestamp)
  const latest = mine.at(-1)
  const earlier = mine.length > 1 ? mine[mine.length - 2] : undefined
  let bigValue = trail.typicalMin * 60
  let survey = 'A typical time · your first hike is still open'
  if (hasRun && pb !== undefined && latest) {
    bigValue = latest.timeSec
    const day = latest.weather
      ? `${latest.weather.temp}° ${latest.weather.sky.toLowerCase()}, ${latest.conditions.join(', ').toLowerCase()}`
      : latest.conditions.join(', ').toLowerCase()
    survey = earlier
      ? `last time · ${day} · previous was ${formatTime(earlier.timeSec)} on a ${earlier.conditions.join(', ').toLowerCase()} day`
      : `last time · ${day}`
  }
  const go = () => navigate(`/record?trail=${trail.id}`)
  const photo = heroPhoto(trail.id)

  return (
    <div className="page tr-page">
      <div style={{ position: 'relative', height: 300 }}>
        {photo && <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.12), rgba(11,23,22,0.78))' }} />
        <button className="btn btn-ghost" style={{ position: 'absolute', top: 12, left: 16 }} aria-label="Back" onClick={() => navigate(-1)}>←</button>
        <button className="btn btn-ghost" style={{ position: 'absolute', top: 12, right: 16, color: saved ? 'var(--glacier-glow)' : undefined }} onClick={() => toggleSaveTrail(trail.id)}>
          {saved ? 'Saved' : 'Save'}
        </button>
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 64 }}>
          <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>
            {hasRun ? `You've hiked this ${runs.filter((r) => r.userId === CURRENT_USER_ID && r.trailId === trail.id).length} times` : 'New to you'}
            {' · '}{trail.region} · {trail.difficulty}
          </p>
          <h1 className="display" style={{ color: 'var(--rock-flour)', fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 6 }}>{trail.name}</h1>
        </div>
      </div>
      <div style={{ margin: '-48px 16px 0', position: 'relative', height: 210, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(11,23,22,0.18)' }}>
        <TrailMap trails={[]} route={trail.path} mood="day" pitch={50} fit fitPadding={{ top: 20, bottom: 20, left: 20, right: 20 }} interactive />
      </div>

      <div className="container page-pad" style={{ marginTop: 16 }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <p className="tr-summary">{trail.summary}</p>
          <Link to="/lodge/bow-valley" className="survey" style={{ display: 'inline-block', marginTop: 10, color: 'var(--glacier)' }}>
            Bow Valley lodge on {trail.name}
          </Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 16px', marginTop: 28 }}>
            <Fact
              kind="time"
              value={spokenMinutes(expectedMin(trail, runs, weightKg ?? 70, heightCm ?? 175))}
              label="your expected time"
            />
            <Fact
              kind="time"
              value={(() => {
                const times = runs.filter((r) => r.trailId === trail.id).map((r) => r.timeSec)
                if (!times.length) return '—'
                return spokenMinutes(times.reduce((sum, t) => sum + t, 0) / times.length / 60)
              })()}
              label="hikers' average"
            />
            <Fact kind="climb" value={`${Math.round(trail.gainM)} m`} label="elevation gain" />
            <LineRating reviews={reviews.filter((r) => r.trailId === trail.id)} />
          </div>
          {hasRun && (
            <>
              <CountUp value={bigValue} className="tr-big" />
              <p className="survey num" style={{ marginTop: 8 }}>{survey}</p>
            </>
          )}
          <TrailBadges
            name={trail.name}
            holds={iAmFirst}
            rank={hasRun ? myIdx + 1 : 0}
            field={board.length}
            attempts={runs.filter((r) => r.userId === CURRENT_USER_ID && r.trailId === trail.id).length}
            improvedSec={(() => {
              const mine = runs
                .filter((r) => r.userId === CURRENT_USER_ID && r.trailId === trail.id)
                .sort((a, b) => a.timestamp - b.timestamp)
              if (!hasRun || !pb || mine.length < 2) return 0
              return mine[0].timeSec - pb
            })()}
          />
          <WeatherWeek lat={trail.center[1]} lng={trail.center[0]} band />
          <PackAdvice
            trail={trail}
            runs={runs}
            weightKg={weightKg ?? 70}
            heightCm={heightCm}
            saved={heightCm !== undefined || weightKg !== undefined}
          />
          {hasRun && <TrailStory trailId={trail.id} />}
        </motion.div>

        <TrailDirt trailId={trail.id} />
        <TrailReviews trailId={trail.id} />

        <section className="tr-band photos">
          <h2 className="chapter">Photos</h2>
          <PhotoRail trailId={trail.id} />
        </section>
        <TrailElevation trail={trail} />
        <TrailBoard trailId={trail.id} />
      </div>

      <div className="container tr-bar">
        <div className="btn-row">
          <button className="btn btn-larch" onClick={go}>{hasRun ? 'Hike it again' : 'Start this hike'}</button>
          <button className="btn btn-ghost" onClick={() => document.getElementById('pack')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            What to bring
          </button>
        </div>
      </div>
    </div>
  )
}
