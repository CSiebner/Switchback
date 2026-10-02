import '../styles/trail.css'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { TrailBoard } from '../components/TrailBoard'
import { TrailDirt } from '../components/TrailDirt'
import { TrailElevation } from '../components/TrailElevation'
import { PhotoRail } from '../components/PhotoRail'
import { WeatherWeek } from '../components/WeatherWeek'
import { TrailReviews } from '../components/TrailReviews'
import { TrailMap } from '../components/TrailMap'
import { CURRENT_USER_ID, getHiker } from '../data/seed'
import { getTrail } from '../data/trails'
import { formatDuration, formatGain, formatKm, formatTime } from '../lib/format'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const

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
  const setChase = useAppStore((s) => s.setChase)
  const savedTrailIds = useAppStore((s) => s.savedTrailIds)
  const toggleSaveTrail = useAppStore((s) => s.toggleSaveTrail)

  useEffect(() => {
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
  const above = hasRun && myIdx > 0 ? board[myIdx - 1] : undefined
  const below = hasRun && myIdx < board.length - 1 ? board[myIdx + 1] : undefined
  const nameOf = (uid: string) => getHiker(uid)?.name ?? 'Rival'
  const saved = savedTrailIds.includes(trail.id)

  let bigValue = trail.typicalMin * 60
  let survey = 'typical · first ascent waiting'
  if (hasRun && pb !== undefined) {
    bigValue = pb
    if (iAmFirst) {
      survey = below
        ? `your PB · holding the line · ${formatTime(below.timeSec - pb)} ahead of ${nameOf(below.userId)}`
        : 'your PB · holding the line'
    } else if (above) {
      survey = `your PB · #${myIdx + 1} of ${board.length} · ${formatTime(pb - above.timeSec)} behind ${nameOf(above.userId)}`
    }
  }

  const go = () => {
    if (above) {
      setChase({ trailId: trail.id, userId: above.userId, timeSec: above.timeSec, label: nameOf(above.userId) })
    }
    navigate(`/record?trail=${trail.id}`)
  }

  return (
    <div className="page tr-page">
      <div className="tr-hero">
        <TrailMap
          trails={[]}
          route={trail.path}
          mood="day"
          pitch={55}
          fit
          fitPadding={{ top: 72, bottom: 40, left: 44, right: 44 }}
          interactive={false}
        />
        <button className="btn btn-ghost tr-chrome back" aria-label="Back" onClick={() => navigate(-1)}>
          ←
        </button>
        <button
          className={`btn btn-ghost tr-chrome save ${saved ? 'saved' : ''}`}
          aria-pressed={saved}
          onClick={() => toggleSaveTrail(trail.id)}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
        <div className="tr-hero-fade" />
      </div>

      <div className="container page-pad tr-title">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <p className="survey num">
            {trail.region} · {trail.difficulty} · {formatKm(trail.distKm)} · {formatGain(trail.gainM)} ↑ · typical{' '}
            {formatDuration(trail.typicalMin)}
          </p>
          <h1 className="display tr-h1">{trail.name}</h1>
          <p className="tr-summary">{trail.summary}</p>
          <WeatherWeek lat={trail.center[1]} lng={trail.center[0]} />

          <CountUp value={bigValue} className={`tr-big ${iAmFirst ? 'gold' : ''}`} />
          <p className="survey num" style={{ marginTop: 8 }}>{survey}</p>
        </motion.div>

        <section style={{ marginTop: 22 }}>
          <p className="survey">On this line</p>
          <div style={{ marginTop: 10 }}>
            <PhotoRail trailId={trail.id} tall />
          </div>
        </section>
        <TrailElevation trail={trail} />
        <TrailBoard trailId={trail.id} />
        <TrailDirt trailId={trail.id} />
        <TrailReviews trailId={trail.id} />
      </div>

      <div className="container tr-bar">
        <button className="btn btn-larch" onClick={go}>
          {above ? `Run the ghost · vs ${nameOf(above.userId)}` : 'Record this line'}
        </button>
      </div>
    </div>
  )
}
