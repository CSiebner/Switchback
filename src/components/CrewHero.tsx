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
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)
  const outing = crew.outing
  const outingTrail = outing ? getTrail(outing.trailId) : undefined
  const going = outing?.going.includes(CURRENT_USER_ID) ?? false

  const pct = Math.min(100, (crew.challengeProgress / crew.challengeGoal) * 100)
  const ordered = [...crew.members].sort((a, b) => (a === CURRENT_USER_ID ? -1 : b === CURRENT_USER_ID ? 1 : 0))
  const shown = ordered.slice(0, MAX_DISCS)
  const extra = ordered.length - shown.length
  const othersGoing = outing ? outing.going.filter((id) => id !== CURRENT_USER_ID).length : 0
  const goingCount = othersGoing + (going ? 1 : 0)

  return (
    <section style={{ marginTop: 8 }}>
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
            <div className="hairline" style={{ marginTop: 16, paddingTop: 16 }}>
              <Link to={`/trail/${outingTrail.id}`} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center' }}>
                <RouteGlyph coords={outingTrail.path} size={44} strokeWidth={2} />
                <span>
                  <span className="cr-name">{outingTrail.name}</span>
                  <span className="survey" style={{ display: 'block', marginTop: 2 }}>{goingCount} going</span>
                </span>
              </Link>
              <div className="plan-list">
                <div className="plan-row">
                  <span className="plan-k">When</span>
                  <p className="plan-v">{outing.when}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Pace</span>
                  <p className="plan-v">{outing.pace ?? 'steady'}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Meet</span>
                  <p className="plan-v">{outing.meet ?? 'Meet TBD'}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Driving</span>
                  <p className="plan-v">{outing.driver ? (getHiker(outing.driver)?.name ?? 'Open') : 'Open'}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Going</span>
                  <p className="plan-v">
                    {outing.going.map((id) => getHiker(id)?.name ?? 'Hiker').join(', ')}
                    {outing.seats !== undefined
                      ? ` · ${Math.max(0, outing.seats - goingCount)} ${outing.seats - goingCount === 1 ? 'seat' : 'seats'} left`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                className={`chip cr-chip ${going ? 'active' : ''}`}
                style={{ marginTop: 14 }}
                aria-pressed={going}
                onClick={() => setOutingGoing(crew.id, !going)}
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
    </section>
  )
}
