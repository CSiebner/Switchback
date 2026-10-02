import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CURRENT_USER_ID, getHiker, type Crew } from '../data/seed'
import { getTrail } from '../data/trails'
import { useAppStore } from '../store/useAppStore'
import { RouteGlyph } from './RouteGlyph'

const EASE = [0.22, 1, 0.36, 1] as const
const MAX_DISCS = 6

export function CrewHero({ crew, joined, showOuting = true }: { crew: Crew; joined: boolean; showOuting?: boolean }) {
  const joinCrew = useAppStore((s) => s.joinCrew)
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)
  const outing = crew.outing
  const outingTrail = outing ? getTrail(outing.trailId) : undefined
  const going = outing?.going.includes(CURRENT_USER_ID) ?? false

  const pct = Math.min(100, (crew.challengeProgress / crew.challengeGoal) * 100)
  const ordered = [...crew.members].sort((a, b) => (a === CURRENT_USER_ID ? -1 : b === CURRENT_USER_ID ? 1 : 0))
  const shown = ordered.slice(0, MAX_DISCS)
  const extra = ordered.length - shown.length
  const seatsLeft = outing?.seats !== undefined ? Math.max(0, outing.seats - outing.going.length) : undefined

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

          {showOuting && outing && outingTrail && (
            <div className="hairline cr-row">
              <Link to={`/trail/${outingTrail.id}`} className="cr-glyph" aria-label={outingTrail.name}>
                <RouteGlyph coords={outingTrail.path} size={44} strokeWidth={2} />
              </Link>
              <div className="cr-text">
                <span className="cr-name">{outingTrail.name}</span>
                <span style={{ fontWeight: 700 }}>{outing.when} · {outing.pace ?? 'steady'}</span>
                <span className="survey">
                  {outing.meet ?? 'Meet TBD'}
                  {outing.driver ? ` · ${getHiker(outing.driver)?.name ?? 'someone'} driving` : ''}
                  {seatsLeft !== undefined ? ` · ${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left` : ''}
                </span>
              </div>
              <button
                className={`chip cr-chip ${going ? 'active' : ''}`}
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
