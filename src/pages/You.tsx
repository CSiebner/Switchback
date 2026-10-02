import '../styles/you.css'
import { useEffect, useMemo } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { YouChart } from '../components/YouChart'
import { YouLines, type YouLine } from '../components/YouLines'
import { YouLog } from '../components/YouLog'
import { YouSettings } from '../components/YouSettings'
import { YouStrip } from '../components/YouStrip'
import { CURRENT_USER_ID } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

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
  const heldCount = lines.filter((l) => l.rank === 1).length

  const chaseTrail = chase ? getTrail(chase.trailId) : undefined
  const chaseRuns = chase ? mine.filter((r) => r.trailId === chase.trailId) : []

  return (
    <div className="page page-pad yo-page">
      <div className="container">
        <motion.div
          className="yo-head"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="survey">logbook</p>
          <h1 className="display yo-h1">You</h1>
          <p className="survey num" style={{ marginTop: 10 }}>
            {ageBracket} · {experience} · {joinedCrewIds.length} crew · {mine.length} hikes
          </p>

          <div className="yo-big-row">
            <CountUp value={totalGain} />
            <span className="survey">m ↑</span>
          </div>
          <p className="survey num" style={{ marginTop: 10 }}>
            {totalKm.toFixed(1)} km · {mine.length} hikes · {pbCount} lines with a PB · {heldCount} held
          </p>
          {lines.length > 0 && <YouStrip lines={lines.map((l) => ({ trail: l.trail, held: l.rank === 1 }))} />}
        </motion.div>

        <YouLines lines={lines} />

        {chase && chaseTrail && chaseRuns.length >= 2 && <YouChart trail={chaseTrail} runs={chaseRuns} chase={chase} />}

        <YouLog />
        <YouSettings />
      </div>
    </div>
  )
}
