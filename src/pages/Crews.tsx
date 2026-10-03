import '../styles/crews.css'
import { Link } from 'react-router-dom'
import { CrewBoard } from '../components/CrewBoard'
import { heroPhoto } from '../data/photos'
import { getTrail } from '../data/trails'
import { CrewFeed } from '../components/CrewFeed'
import { CrewHero } from '../components/CrewHero'
import { PlanHike } from '../components/PlanHike'
import { StartCrew } from '../components/StartCrew'
import { CrewWeek } from '../components/CrewWeek'
import { activeDuel, crewScore, formatMetric, primaryLodge } from '../lib/lodge'
import { useAppStore } from '../store/useAppStore'

export function Crews() {
  const crews = useAppStore((s) => s.crews)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const joinCrew = useAppStore((s) => s.joinCrew)
  const lodges = useAppStore((s) => s.lodges)
  const duels = useAppStore((s) => s.duels)
  const runs = useAppStore((s) => s.runs)
  const mine = joinedCrewIds.map((id) => crews.find((c) => c.id === id)).find(Boolean)
  const lodge = primaryLodge(lodges)
  const duel = lodge && mine ? activeDuel(duels, lodge.id) : undefined
  const inDuel = !!duel && !!mine && (duel.fromCrewId === mine.id || duel.toCrewId === mine.id)
  const heroCrew = mine ?? [...crews].sort((a, b) => b.members.length - a.members.length)[0]
  const others = crews.filter((c) => c.id !== heroCrew?.id)
  const outingTrail = heroCrew?.outing ? getTrail(heroCrew.outing.trailId) : undefined
  const photo = heroPhoto(outingTrail?.id ?? 'bow-valley')

  return (
    <div className="page cr-page">
      {heroCrew && (
        <div style={{ position: 'relative', height: 280 }}>
          {photo && <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.15), rgba(11,23,22,0.82))' }} />
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, color: 'var(--rock-flour)' }}>
            <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>
              Your crew · {heroCrew.members.length} hikers · people you hike with
            </p>
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>
              {heroCrew.name}
            </h1>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {heroCrew.challengeProgress.toLocaleString('en-US')} of {heroCrew.challengeGoal.toLocaleString('en-US')} {heroCrew.challengeUnit}
            </p>
            <p className="survey" style={{ marginTop: 4, color: 'rgba(228,238,235,0.85)' }}>
              {heroCrew.challenge}
            </p>
          </div>
        </div>
      )}
      <div className="container page-pad">
        <p style={{ lineHeight: 1.45 }}>
          A crew is the people you actually hike with. The plan, the car, and what you learned on the trail stay here.
        </p>
        {lodge && inDuel && duel && mine && (() => {
          const otherId = duel.fromCrewId === mine.id ? duel.toCrewId : duel.fromCrewId
          const other = crews.find((c) => c.id === otherId)
          const ours = crewScore(mine, runs, duel.metric, duel.startMs, duel.endMs)
          const theirs = other ? crewScore(other, runs, duel.metric, duel.startMs, duel.endMs) : undefined
          return (
            <Link to={`/lodge/${lodge.id}`} style={{ display: 'block', marginTop: 16 }}>
              <p className="survey">{lodge.name} lodge</p>
              <p style={{ fontWeight: 800, marginTop: 4 }}>{duel.title}</p>
              {theirs && other && (
                <p className="survey" style={{ marginTop: 4 }}>
                  {formatMetric(duel.metric, ours.average)} per person · {other.name} {formatMetric(duel.metric, theirs.average)}
                </p>
              )}
            </Link>
          )
        })()}
        {outingTrail && (
          <Link to={`/trail/${outingTrail.id}#pack`} className="btn btn-ghost" style={{ width: '100%', marginTop: 14 }}>
            What to bring for {outingTrail.name}
          </Link>
        )}
        {heroCrew && <CrewHero crew={heroCrew} joined={!!mine} showOuting={false} />}
        <CrewFeed
          hideOutings={!!mine}
          pin={
            mine ? (
              <div className="cr-pin-card">
                <p className="chapter">{outingTrail && mine.outing ? 'Planned hike' : 'No hike planned'}</p>
                {outingTrail && mine.outing && (
                  <p style={{ fontWeight: 800, fontSize: 'var(--type-lg)', marginTop: 4 }}>{outingTrail.name}</p>
                )}
                {mine.outing && (
                  <p className="fact-label" style={{ marginTop: 4 }}>
                    {mine.outing.when} · {mine.outing.pace ?? 'steady'}
                    {mine.outing.meet ? ` · ${mine.outing.meet}` : ''}
                  </p>
                )}
                <PlanHike crewId={mine.id} />
              </div>
            ) : (
              <StartCrew />
            )
          }
        />
        {mine && <CrewWeek crew={mine} />}
        {mine && <CrewBoard crew={mine} />}
        {mine && (
          <div style={{ marginTop: 8 }}>
            <StartCrew />
          </div>
        )}

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
