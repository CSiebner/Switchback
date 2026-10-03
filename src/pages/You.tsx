import '../styles/you.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { YouChart } from '../components/YouChart'
import { YouYear } from '../components/YouYear'
import { YouLines, type YouLine } from '../components/YouLines'
import { YouLog } from '../components/YouLog'
import { YouSettings } from '../components/YouSettings'
import { YouStrip } from '../components/YouStrip'
import { CURRENT_USER_ID, type CrewDuel, type Lodge, type LodgeMetric, type Run } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { heroPhoto } from '../data/photos'
import { activeDuel, formatMetric, hikerScores, primaryLodge } from '../lib/lodge'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'
import { StatMark, type StatKind } from '../components/StatMark'

const EASE = [0.22, 1, 0.36, 1] as const

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('en-US'))
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: EASE })
    return () => controls.stop()
  }, [mv, value])
  return (
    <motion.span className="yo-big num" aria-label={value.toLocaleString('en-US')}>
      {text}
    </motion.span>
  )
}

export function You() {
  const runs = useAppStore((s) => s.runs)
  const ageBracket = useAppStore((s) => s.ageBracket)
  const experience = useAppStore((s) => s.experience)
  const chase = useAppStore((s) => s.chase)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const displayName = useAppStore((s) => s.displayName)
  const lodges = useAppStore((s) => s.lodges)
  const duels = useAppStore((s) => s.duels)
  const joinedLodgeIds = useAppStore((s) => s.joinedLodgeIds)
  const personalChallenge = useAppStore((s) => s.personalChallenge)
  const setPersonalChallenge = useAppStore((s) => s.setPersonalChallenge)

  const mine = useMemo(() => runs.filter((r) => r.userId === CURRENT_USER_ID), [runs])

  const { totalGain, totalKm, lines } = useMemo(() => {
    let gain = 0
    let km = 0
    for (const r of mine) {
      const t = getTrail(r.trailId)
      gain += t?.gainM ?? 0
      km += t?.distKm ?? 0
    }
    const list: YouLine[] = []
    for (const t of trails) {
      const pb = bestTime(runs, CURRENT_USER_ID, t.id)
      if (pb === undefined) continue
      const board = leaderboard(runs, t.id)
      const trailRuns = mine.filter((r) => r.trailId === t.id).sort((a, b) => a.timestamp - b.timestamp)
      list.push({
        trail: t,
        pb,
        rank: board.findIndex((x) => x.userId === CURRENT_USER_ID) + 1,
        of: board.length,
        firstTs: trailRuns[0].timestamp,
        firstSec: trailRuns[0].timeSec,
        runCount: trailRuns.length,
      })
    }
    list.sort((a, b) => a.rank - b.rank || a.pb - b.pb)
    return { totalGain: gain, totalKm: km, lines: list }
  }, [runs, mine])

  const pbCount = lines.filter((l) => l.runCount > 1 && l.pb < l.firstSec).length

  const chaseTrail = chase ? getTrail(chase.trailId) : undefined
  const chaseRuns = chase ? mine.filter((r) => r.trailId === chase.trailId) : []

  const cover = lines.find((l) => l.rank === 1) ?? lines[0]
  const coverPhoto = cover ? heroPhoto(cover.trail.id) : undefined

  return (
    <div className="page yo-page">
      <div style={{ position: 'relative', height: 280 }}>
        {coverPhoto && <img src={coverPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.1), rgba(11,23,22,0.78))' }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
          <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>
            {displayName || 'Your hikes'} · {ageBracket} · {experience} · {joinedCrewIds.length} {joinedCrewIds.length === 1 ? 'crew' : 'crews'}
          </p>
          <div className="yo-big-row" style={{ color: 'var(--rock-flour)', marginTop: 8, alignItems: 'center' }}>
            <StatMark kind="climb" size={22} light />
            <CountUp value={totalGain} />
            <span className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>m</span>
          </div>
          <p className="stat-inline light">
            <span><StatMark kind="distance" />{totalKm.toFixed(1)} km</span>
            <span><StatMark kind="hikes" />{mine.length} hikes</span>
            <span>{pbCount} times you came back faster</span>
          </p>
        </div>
      </div>
      <div className="container page-pad">
        <p style={{ lineHeight: 1.45 }}>
          Each trail keeps your times beside the weather and the conditions that day. A muddy hike and a dry hike both belong here. They are not the same record.
        </p>
        <Marks hikes={mine.length} trails={lines.length} faster={pbCount} season={finishedMonth(mine)} />
        <PersonalGoal challenge={personalChallenge} runs={mine} onSave={setPersonalChallenge} />
        <LodgeStanding lodges={lodges} duels={duels} joined={joinedLodgeIds} runs={runs} />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          {lines.length > 0 && <YouStrip lines={lines.map((l) => ({ trail: l.trail, held: l.rank === 1 }))} />}
        </motion.div>

        <YouLines lines={lines} />
        <YouYear runs={mine} />

        {chase && chaseTrail && chaseRuns.length >= 2 && <YouChart trail={chaseTrail} runs={chaseRuns} chase={chase} />}

        <YouLog />
        <YouSettings />
      </div>
    </div>
  )
}

function finishedMonth(runs: Run[]) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const count = runs.filter((r) => r.timestamp >= start && r.timestamp < end).length
  if (!count) return ''
  const label = new Date(start).toLocaleString('en-US', { month: 'long' })
  return `You finished ${label} with ${count} ${count === 1 ? 'hike' : 'hikes'}`
}

function Marks({ hikes, trails, faster, season }: { hikes: number; trails: number; faster: number; season: string }) {
  const cards: { kind: string; icon: StatKind; kicker: string; value: string; detail: string }[] = [
    { kind: 'first', icon: 'distance', kicker: 'First days', value: String(trails), detail: trails === 1 ? 'trail with a day saved' : 'trails with a day saved' },
    { kind: 'faster', icon: 'climb', kicker: 'Came back faster', value: String(faster), detail: faster === 1 ? 'trail improved' : 'trails improved' },
    { kind: 'season', icon: 'hikes', kicker: 'Season', value: season ? season.replace(/^You finished /, '').split(' with ')[0] : String(hikes), detail: season ? season.replace(/^You finished \w+ with /, '') : 'hikes in the record' },
  ]
  return (
    <section className="yo-section">
      <span className="survey head">Marks</span>
      <p className="survey" style={{ marginTop: 6 }}>Accomplishments. Each one is a thing you have done.</p>
      <div className="mark-grid">
        {cards.map((card) => (
          <article key={card.kind} className={`mark-card ${card.kind}`}>
            <StatMark kind={card.icon} size={26} />
            <div>
              <span className="survey">{card.kicker}</span>
              <strong>{card.value}</strong>
              <p style={{ marginTop: 4 }}>{card.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PersonalGoal({
  challenge,
  runs,
  onSave,
}: {
  challenge?: { title: string; metric: LodgeMetric; goal: number }
  runs: Run[]
  onSave: (challenge?: { title: string; metric: LodgeMetric; goal: number }) => void
}) {
  const [metric, setMetric] = useState<LodgeMetric>(challenge?.metric ?? 'elevation')
  const [goal, setGoal] = useState(String(challenge?.goal ?? 5000))
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const total = runs
    .filter((r) => r.timestamp >= start.getTime())
    .reduce((sum, run) => {
      const trail = getTrail(run.trailId)
      if (!trail) return sum
      return sum + (metric === 'elevation' ? trail.gainM : trail.distKm)
    }, 0)
  const target = Number(goal)
  return (
    <section className="yo-section">
      <span className="survey head">Your challenge</span>
      <p className="survey" style={{ marginTop: 6 }}>A goal you set for yourself, over the last 30 days. Separate from a crew or a lodge.</p>
      <div className="segmented" style={{ marginTop: 12 }}>
        <button type="button" className={metric === 'elevation' ? 'active' : ''} onClick={() => setMetric('elevation')}>Elevation</button>
        <button type="button" className={metric === 'distance' ? 'active' : ''} onClick={() => setMetric('distance')}>Distance</button>
      </div>
      <input
        inputMode="numeric"
        value={goal}
        aria-label="Goal"
        onChange={(e) => setGoal(e.target.value)}
        style={{ width: '100%', marginTop: 10, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
      />
      {challenge && target > 0 && (
        <p style={{ marginTop: 10, fontWeight: 700 }}>
          {metric === 'elevation' ? `${Math.round(total).toLocaleString('en-US')} m` : `${total.toFixed(1)} km`} of {target.toLocaleString('en-US')}
        </p>
      )}
      <button
        className="btn btn-larch"
        style={{ width: '100%', marginTop: 12 }}
        disabled={!Number(goal)}
        onClick={() => onSave({ title: 'My 30 days', metric, goal: Number(goal) })}
      >
        Save challenge
      </button>
    </section>
  )
}

function LodgeStanding({ lodges, duels, joined, runs }: { lodges: Lodge[]; duels: CrewDuel[]; joined: string[]; runs: Run[] }) {
  const lodge = primaryLodge(lodges.filter((l) => joined.includes(l.id)).concat(lodges))
  const duel = lodge ? activeDuel(duels, lodge.id) : undefined
  if (!lodge || !duel) return null
  const rows = hikerScores(lodge.memberIds, runs, 'elevation', duel.startMs, duel.endMs)
  const mine = rows.find((r) => r.userId === 'you')
  const rank = rows.findIndex((r) => r.userId === 'you') + 1
  return (
    <section className="yo-section">
      <span className="survey head">{lodge.name} lodge</span>
      <p style={{ marginTop: 8, lineHeight: 1.45 }}>
        {formatMetric('elevation', mine?.total ?? 0)} of elevation over these dates.
        {rank ? ` You are #${rank} among hikers in the lodge.` : ''}
      </p>
      <Link to={`/lodge/${lodge.id}`} className="survey" style={{ display: 'inline-block', marginTop: 8, color: 'var(--glacier)' }}>
        Open the lodge boards
      </Link>
    </section>
  )
}
