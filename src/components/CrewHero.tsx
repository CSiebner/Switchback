import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CURRENT_USER_ID, getHiker, type Crew } from '../data/seed'
import { getTrail } from '../data/trails'
import { useAppStore } from '../store/useAppStore'
import { RouteGlyph } from './RouteGlyph'

const EASE = [0.22, 1, 0.36, 1] as const
const MAX_DISCS = 6

export function CrewHero({ crew, joined }: { crew: Crew; joined: boolean }) {
  const joinCrew = useAppStore((s) => s.joinCrew)
  const outing = crew.outing
  const outingTrail = outing ? getTrail(outing.trailId) : undefined
  const alreadyGoing = outing?.going.includes(CURRENT_USER_ID) ?? false
  const [going, setGoing] = useState(alreadyGoing)

  const pct = Math.min(100, (crew.challengeProgress / crew.challengeGoal) * 100)
  const ordered = [...crew.members].sort((a, b) => (a === CURRENT_USER_ID ? -1 : b === CURRENT_USER_ID ? 1 : 0))
  const shown = ordered.slice(0, MAX_DISCS)
  const extra = ordered.length - shown.length
  const othersGoing = outing ? outing.going.filter((id) => id !== CURRENT_USER_ID).length : 0
  const goingCount = othersGoing + (going ? 1 : 0)

  return (
    <motion.section
      className="panel cr-hero"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="survey cr-hero-name">
        {crew.name} · {crew.region} · {crew.members.length} hikers
      </span>

      <div className="cr-big-row">
        <span className="cr-big num">{crew.challengeProgress.toLocaleString('en-US')}</span>
        <span className="survey">
          / {crew.challengeGoal.toLocaleString('en-US')} {crew.challengeUnit} · {crew.challenge}
        </span>
      </div>

      <div className="cr-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <motion.i
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        />
      </div>

      {joined ? (
        <>
          <div className="cr-members">
            {shown.map((id) => {
              const h = getHiker(id)
              return (
                <span key={id} className={`cr-disc ${id === CURRENT_USER_ID ? 'me' : ''}`} title={h?.name}>
                  {h?.initials ?? '??'}
                </span>
              )
            })}
            {extra > 0 && <span className="cr-disc more">+{extra}</span>}
          </div>

          {outing && outingTrail && (
            <div className="hairline cr-row">
              <Link to={`/trail/${outingTrail.id}`} className="cr-glyph" aria-label={outingTrail.name}>
                <RouteGlyph coords={outingTrail.path} size={44} strokeWidth={2} />
              </Link>
              <div className="cr-text">
                <span className="cr-name">{outingTrail.name}</span>
                <span className="survey">{outing.when} · {outing.pace ?? 'steady'} · {goingCount} going</span>
                <span className="survey">
                  {outing.meet ?? 'Meet TBD'}
                  {outing.driver ? ` · ${getHiker(outing.driver)?.name ?? 'someone'} driving` : ''}
                  {outing.seats !== undefined ? ` · ${outing.seats} seats` : ''}
                </span>
              </div>
              <button
                className={`chip cr-chip ${going ? 'active' : ''}`}
                aria-pressed={going}
                onClick={() => setGoing((g) => !g)}
              >
                {going ? 'Going' : "I'm in"}
              </button>
            </div>
          )}
          {!outing && <div style={{ height: 14 }} />}
        </>
      ) : (
        <button className="btn btn-larch cr-join" onClick={() => joinCrew(crew.id)}>
          Join {crew.name}
        </button>
      )}
    </motion.section>
  )
}
