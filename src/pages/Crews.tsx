import '../styles/crews.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CrewBoard } from '../components/CrewBoard'
import { heroPhoto } from '../data/photos'
import { getTrail } from '../data/trails'
import { CrewFeed } from '../components/CrewFeed'
import { CrewHero } from '../components/CrewHero'
import { PlanHike } from '../components/PlanHike'
import { Talk } from '../components/Talk'
import { StartCrew } from '../components/StartCrew'
import { CrewWeek } from '../components/CrewWeek'
import { activeDuel, crewScore, formatMetric, primaryLodge } from '../lib/lodge'
import { getHiker, type LodgeMetric } from '../data/seed'
import { useAppStore } from '../store/useAppStore'

export function Crews() {
  const crews = useAppStore((s) => s.crews)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const joinCrew = useAppStore((s) => s.joinCrew)
  const lodges = useAppStore((s) => s.lodges)
  const duels = useAppStore((s) => s.duels)
  const runs = useAppStore((s) => s.runs)
  const issueDuel = useAppStore((s) => s.issueDuel)
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)
  const requestRide = useAppStore((s) => s.requestRide)
  const acceptRide = useAppStore((s) => s.acceptRide)
  const meetAtPin = useAppStore((s) => s.meetAtPin)
  const toggleOutingKudo = useAppStore((s) => s.toggleOutingKudo)
  const addOutingComment = useAppStore((s) => s.addOutingComment)
  const setCrewAccess = useAppStore((s) => s.setCrewAccess)
  const requestJoin = useAppStore((s) => s.requestJoin)
  const acceptJoin = useAppStore((s) => s.acceptJoin)
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
        {mine && (
          <div style={{ marginTop: 14 }}>
            <p className="survey">Who can join this crew</p>
            <div className="segmented" style={{ marginTop: 8 }}>
              {(['public', 'invite', 'request'] as const).map((access) => (
                <button key={access} type="button" className={(mine.access ?? 'public') === access ? 'active' : ''} onClick={() => setCrewAccess(mine.id, access)}>
                  {access === 'public' ? 'Public' : access === 'invite' ? 'Invite only' : 'Ask to join'}
                </button>
              ))}
            </div>
            <p className="survey" style={{ marginTop: 6 }}>Invites and requests stay on this phone until the app is hosted.</p>
            {(mine.joinRequests ?? []).map((id) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>{getHiker(id)?.name ?? id} asked to join</span>
                <button type="button" className="chip" onClick={() => acceptJoin(mine.id, id)}>Accept</button>
              </div>
            ))}
          </div>
        )}
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
        {mine && (
          <section className="cr-plan">
            {outingTrail && heroPhoto(outingTrail.id) && (
              <img src={heroPhoto(outingTrail.id)!.src} alt="" />
            )}
            <div className="cr-plan-body">
              <p className="survey">{mine.outing ? 'Planned hike' : 'No hike planned'}</p>
              <h2 className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 4 }}>
                {outingTrail ? outingTrail.name : 'Choose the next one'}
              </h2>
              {mine.outing && (
                <div className="cr-plan-facts">
                  <span>When</span><p>{mine.outing.when}</p>
                  <span>Pace</span><p>{mine.outing.pace ?? 'steady'}</p>
                  <span>Trailhead</span>
                  <p>
                    {mine.outing.meet ? (
                      <a className="cr-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mine.outing.meet)}`} target="_blank" rel="noreferrer">
                        {mine.outing.meet}
                      </a>
                    ) : 'To be decided'}
                  </p>
                  <span>Ride from</span>
                  <p>
                    {mine.outing.depart ? (
                      <a className="cr-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mine.outing.depart)}`} target="_blank" rel="noreferrer">
                        {mine.outing.depart}
                      </a>
                    ) : 'No shared ride'}
                  </p>
                  <span>Seats</span>
                  <p>{mine.outing.seats !== undefined ? `${Math.max(0, mine.outing.seats - mine.outing.going.length)} left` : 'Open'}</p>
                  <span>Join</span>
                  <p>{mine.outing.openToSolo ? 'Solo hikers welcome' : 'Crew only'}</p>
                  <span>Going</span>
                  <p className="cr-going">
                    {mine.outing.going.map((id) => (
                      <span key={id} className={`cr-face ${id === 'you' ? 'me' : ''}`} title={getHiker(id)?.name}>
                        {id === 'you' ? 'You' : getHiker(id)?.initials ?? '·'}
                      </span>
                    ))}
                    <span className="cr-going-names">
                      {mine.outing.going.map((id) => (id === 'you' ? 'You' : getHiker(id)?.name)).filter(Boolean).join(', ')}
                    </span>
                  </p>
                </div>
              )}
              {mine.outing && (mine.outing.meeting ?? []).length > 0 && (
                <p className="survey" style={{ marginTop: 10 }}>
                  Meeting at the trailhead · {(mine.outing.meeting ?? []).map((id) => (id === 'you' ? 'You' : getHiker(id)?.name)).filter(Boolean).join(', ')}
                </p>
              )}
              {mine.outing && (mine.outing.rideRequests ?? []).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p className="survey">Ride requests</p>
                  {(mine.outing.rideRequests ?? []).map((id) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span>{id === 'you' ? 'You' : getHiker(id)?.name}</span>
                      {mine.members.includes('you') && id !== 'you' && (
                        <button type="button" className="chip" onClick={() => acceptRide(mine.id, id)}>Accept</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="btn-row" style={{ marginTop: 14 }}>
                {mine.outing && !mine.outing.going.includes('you') && !(mine.outing.rideRequests ?? []).includes('you') && (
                  <button type="button" className="chip" onClick={() => requestRide(mine.id)}>Request a ride</button>
                )}
                {mine.outing && (mine.outing.rideRequests ?? []).includes('you') && (
                  <span className="chip active">Ride requested</span>
                )}
                {mine.outing && mine.outing.going.includes('you') && (
                  <button type="button" className="chip active" onClick={() => setOutingGoing(mine.id, false)}>In the car</button>
                )}
                {mine.outing && (
                  <button
                    type="button"
                    className={`chip ${(mine.outing.meeting ?? []).includes('you') ? 'active' : ''}`}
                    onClick={() => meetAtPin(mine.id)}
                  >
                    {(mine.outing.meeting ?? []).includes('you') ? 'Meeting at the pin' : 'Meet at the pin'}
                  </button>
                )}
                {outingTrail && (
                  <Link to={`/trail/${outingTrail.id}#pack`} className="btn btn-ghost" style={{ flex: 1 }}>
                    What to bring
                  </Link>
                )}
              </div>
              {mine.outing && (
                <Talk
                  kudos={mine.outing.kudos}
                  comments={mine.outing.comments}
                  onKudo={() => toggleOutingKudo(mine.id)}
                  onComment={(text) => addOutingComment(mine.id, text)}
                  placeholder="Note on this hike"
                />
              )}
              <PlanHike crewId={mine.id} />
            </div>
          </section>
        )}
        {mine && lodge && (
          <CrewChallengeForm lodgeId={lodge.id} fromCrewId={mine.id} others={crews.filter((c) => lodge.crewIds.includes(c.id) && c.id !== mine.id)} onIssue={issueDuel} />
        )}
        {!mine && <StartCrew />}
        {heroCrew && <CrewHero crew={heroCrew} joined={!!mine} showOuting={false} />}
        <CrewFeed hideOutings={!!mine} />
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
                  ) : (c.access ?? 'public') === 'invite' ? (
                    <span className="chip cr-chip">Invite only</span>
                  ) : (c.joinRequests ?? []).includes('you') ? (
                    <span className="chip cr-chip active">Requested</span>
                  ) : (
                    <button className="chip cr-chip" onClick={() => ((c.access ?? 'public') === 'request' ? requestJoin(c.id) : joinCrew(c.id))}>
                      {(c.access ?? 'public') === 'request' ? 'Ask to join' : 'Join'}
                    </button>
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

function CrewChallengeForm({
  lodgeId,
  fromCrewId,
  others,
  onIssue,
}: {
  lodgeId: string
  fromCrewId: string
  others: { id: string; name: string }[]
  onIssue: (lodgeId: string, fromCrewId: string, toCrewId: string, metric: LodgeMetric) => void
}) {
  const [opponent, setOpponent] = useState('')
  if (!others.length) return null
  return (
    <section style={{ marginTop: 22 }}>
      <h2 className="chapter">Challenge a crew in the lodge</h2>
      <p className="survey" style={{ marginTop: 6 }}>Average per person, over the next 30 days. They accept in the lodge.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {others.map((c) => (
          <button key={c.id} type="button" className={`chip ${opponent === c.id ? 'active' : ''}`} onClick={() => setOpponent(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn btn-larch" disabled={!opponent} onClick={() => { onIssue(lodgeId, fromCrewId, opponent, 'elevation'); setOpponent('') }}>Elevation</button>
        <button className="btn btn-ghost" disabled={!opponent} onClick={() => { onIssue(lodgeId, fromCrewId, opponent, 'distance'); setOpponent('') }}>Distance</button>
      </div>
    </section>
  )
}
