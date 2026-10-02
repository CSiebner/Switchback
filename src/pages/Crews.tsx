import '../styles/crews.css'
import { motion } from 'framer-motion'
import { CrewBoard } from '../components/CrewBoard'
import { CrewFeed } from '../components/CrewFeed'
import { CrewHero } from '../components/CrewHero'
import { PlanHike } from '../components/PlanHike'
import { StartCrew } from '../components/StartCrew'
import { useAppStore } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const

export function Crews() {
  const crews = useAppStore((s) => s.crews)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const joinCrew = useAppStore((s) => s.joinCrew)

  const mine = joinedCrewIds.map((id) => crews.find((c) => c.id === id)).find(Boolean)
  const heroCrew = mine ?? [...crews].sort((a, b) => b.members.length - a.members.length)[0]
  const others = crews.filter((c) => c.id !== heroCrew?.id)

  return (
    <div className="page page-pad cr-page">
      <div className="container">
        <motion.div
          className="cr-head"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <h1 className="display cr-h1">Crews</h1>
          <p className="survey num" style={{ marginTop: 10 }}>
            {crews.length} crews near you · {mine ? mine.name : 'pick one'}
          </p>
        </motion.div>

        <StartCrew />
        {heroCrew && <CrewHero crew={heroCrew} joined={!!mine} />}
        {mine && <PlanHike crewId={mine.id} />}
        {mine && <CrewBoard crew={mine} />}
        <CrewFeed />

        {others.length > 0 && (
          <section className="cr-section">
            <span className="survey head">More crews</span>
            {others.map((c) => {
              const joined = joinedCrewIds.includes(c.id)
              return (
                <div key={c.id} className="hairline cr-row" style={{ gridTemplateColumns: '1fr auto' }}>
                  <div className="cr-text">
                    <span className="cr-name">{c.name}</span>
                    <span className="survey ell">
                      {c.region} · {c.members.length} hikers · {c.challenge}
                    </span>
                  </div>
                  {joined ? (
                    <span className="chip cr-chip active" style={{ cursor: 'default' }}>Joined</span>
                  ) : (
                    <button className="chip cr-chip" onClick={() => joinCrew(c.id)}>Join</button>
                  )}
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
