import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { heroPhoto } from '../data/photos'
import { getHiker } from '../data/seed'
import type { LodgeMetric } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { crewScore, formatMetric, hikerScores } from '../lib/lodge'
import { relativeTime } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

export function Lodge() {
  const { id = '' } = useParams()
  const lodges = useAppStore((s) => s.lodges)
  const crews = useAppStore((s) => s.crews)
  const duels = useAppStore((s) => s.duels)
  const runs = useAppStore((s) => s.runs)
  const conditions = useAppStore((s) => s.conditions)
  const reviews = useAppStore((s) => s.reviews)
  const questions = useAppStore((s) => s.questions)
  const lodgeChallenges = useAppStore((s) => s.lodgeChallenges)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const acceptDuel = useAppStore((s) => s.acceptDuel)
  const issueDuel = useAppStore((s) => s.issueDuel)
  const confirmCondition = useAppStore((s) => s.confirmCondition)
  const addQuestion = useAppStore((s) => s.addQuestion)
  const joinLodgeChallenge = useAppStore((s) => s.joinLodgeChallenge)
  const [askTrail, setAskTrail] = useState('ha-ling')
  const [askText, setAskText] = useState('')
  const lodge = lodges.find((l) => l.id === id)
  const [metric, setMetric] = useState<LodgeMetric>('elevation')
  const [who, setWho] = useState<'crews' | 'hikers'>('crews')
  const [opponent, setOpponent] = useState('')

  const mine = crews.filter((c) => lodge?.crewIds.includes(c.id) && joinedCrewIds.includes(c.id))
  const lodgeCrews = crews.filter((c) => lodge?.crewIds.includes(c.id))
  const duel = duels.find((d) => d.lodgeId === id && d.status === 'active') ?? duels.find((d) => d.lodgeId === id && d.status === 'pending')
  const start = duel?.startMs ?? Date.now() - 30 * 24 * 60 * 60 * 1000
  const end = duel?.endMs ?? Date.now()

  const crewRows = useMemo(() => {
    if (!lodge) return []
    return lodgeCrews
      .map((c) => crewScore(c, runs, metric, start, end))
      .sort((a, b) => b.average - a.average)
  }, [lodge, lodgeCrews, runs, metric, start, end])

  const people = useMemo(() => {
    if (!lodge) return []
    return hikerScores(lodge.memberIds, runs, metric, start, end)
  }, [lodge, runs, metric, start, end])

  if (!lodge) {
    return (
      <div className="page page-pad">
        <p>Lodge not found.</p>
        <Link to="/">Home</Link>
      </div>
    )
  }

  const photo = heroPhoto('bow-valley')
  const fromCrew = crews.find((c) => c.id === duel?.fromCrewId)
  const toCrew = crews.find((c) => c.id === duel?.toCrewId)
  const from = duel && fromCrew ? crewScore(fromCrew, runs, duel.metric, duel.startMs, duel.endMs) : undefined
  const to = duel && toCrew ? crewScore(toCrew, runs, duel.metric, duel.startMs, duel.endMs) : undefined
  const leader = from && to ? (from.average === to.average ? null : from.average > to.average ? from : to) : null
  const weekend = lodgeCrews.filter((c) => c.outing)
  const changed = conditions
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
  const notes = [
    ...questions.map((q) => ({ id: q.id, trailId: q.trailId, userId: q.userId, text: q.text, timestamp: q.timestamp })),
    ...reviews.map((r) => ({ id: r.id, trailId: r.trailId, userId: r.userId, text: r.text, timestamp: r.timestamp })),
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6)
  const openChallenge = lodgeChallenges.find((c) => c.lodgeId === id)
  const fromName = crews.find((c) => c.id === duel?.fromCrewId)?.name
  const toName = crews.find((c) => c.id === duel?.toCrewId)?.name
  const canAccept = !!duel && duel.status === 'pending' && joinedCrewIds.includes(duel.toCrewId)
  const canIssue = mine.length > 0 && lodgeCrews.some((c) => !mine.some((m) => m.id === c.id))

  return (
    <div className="page">
      <div style={{ position: 'relative', height: 280 }}>
        {photo && <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.2), rgba(11,23,22,0.82))' }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, color: 'var(--rock-flour)' }}>
          <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>Lodge · {lodge.region}</p>
          <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>{lodge.name}</h1>
          <p style={{ marginTop: 8, lineHeight: 1.4 }}>{lodge.summary}</p>
        </div>
      </div>

      <div className="container page-pad">
        {duel && from && to && (
          <section className="lodge-block duel">
            <h2 className="chapter">{duel.status === 'pending' ? 'Challenge waiting' : 'Crew challenge'}</h2>
            <p className="survey" style={{ marginTop: 6 }}>{duel.title}. The score is the average per person. The total sits beside it.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <Score name={fromName ?? 'Crew'} score={from} metric={duel.metric} lead={leader?.crewId === from.crewId} />
              <Score name={toName ?? 'Crew'} score={to} metric={duel.metric} lead={leader?.crewId === to.crewId} />
            </div>
            {canAccept && (
              <button className="btn btn-larch" style={{ width: '100%', marginTop: 12 }} onClick={() => acceptDuel(duel.id)}>
                Accept for {toName}
              </button>
            )}
          </section>
        )}

        <section className="lodge-block boards">
          <h2 className="chapter">Lodge boards</h2>
          <p className="survey" style={{ marginTop: 6 }}>Elevation and distance for the same dates. Hikers includes anyone in the lodge, with or without a crew.</p>
          <div className="segmented" style={{ marginTop: 12 }}>
            <button type="button" className={who === 'crews' ? 'active' : ''} onClick={() => setWho('crews')}>Crews</button>
            <button type="button" className={who === 'hikers' ? 'active' : ''} onClick={() => setWho('hikers')}>Hikers</button>
          </div>
          <div className="segmented" style={{ marginTop: 8 }}>
            <button type="button" className={metric === 'elevation' ? 'active' : ''} onClick={() => setMetric('elevation')}>Elevation</button>
            <button type="button" className={metric === 'distance' ? 'active' : ''} onClick={() => setMetric('distance')}>Distance</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {who === 'crews' && crewRows.map((row, i) => {
              const crew = crews.find((c) => c.id === row.crewId)
              return (
                <div key={row.crewId} className="hairline" style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, alignItems: 'center', padding: '14px 0' }}>
                  <span className="num" style={{ fontWeight: 800 }}>#{i + 1}</span>
                  <span>
                    <span style={{ fontWeight: 800, display: 'block' }}>{crew?.name}</span>
                    <span className="survey">{row.out} of {row.roster} out · total {formatMetric(metric, row.total)}</span>
                  </span>
                  <span className="num" style={{ fontWeight: 800 }}>{formatMetric(metric, row.average)}</span>
                </div>
              )
            })}
            {who === 'hikers' && people.map((row, i) => (
              <div key={row.userId} className="hairline" style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, alignItems: 'center', padding: '14px 0', background: row.userId === 'you' ? 'rgba(10,138,130,0.08)' : undefined }}>
                <span className="num" style={{ fontWeight: 800 }}>#{i + 1}</span>
                <span>
                  <span style={{ fontWeight: 800, display: 'block' }}>{row.userId === 'you' ? 'You' : getHiker(row.userId)?.name}</span>
                  <span className="survey">{row.hikes} {row.hikes === 1 ? 'hike' : 'hikes'}</span>
                </span>
                <span className="num" style={{ fontWeight: 800 }}>{formatMetric(metric, row.total)}</span>
              </div>
            ))}
          </div>
        </section>

        {openChallenge && (
          <section className="lodge-block open">
            <h2 className="chapter">Lodge challenge</h2>
            <p className="survey" style={{ marginTop: 6 }}>{openChallenge.title}. Anyone in the lodge can join. This is separate from a crew challenging another crew.</p>
            <button className="btn btn-larch" style={{ width: '100%', marginTop: 12 }} onClick={() => joinLodgeChallenge(openChallenge.id)}>
              {openChallenge.joinedIds.includes('you') ? "You're in" : 'Join the challenge'}
            </button>
            <div style={{ marginTop: 8 }}>
              {hikerScores(openChallenge.joinedIds, runs, openChallenge.metric, openChallenge.startMs, openChallenge.endMs).map((row, i) => (
                <div key={row.userId} className="hairline" style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, padding: '12px 0' }}>
                  <span className="num" style={{ fontWeight: 800 }}>#{i + 1}</span>
                  <span style={{ fontWeight: 800 }}>{row.userId === 'you' ? 'You' : getHiker(row.userId)?.name}</span>
                  <span className="num" style={{ fontWeight: 800 }}>{formatMetric(openChallenge.metric, row.total)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="lodge-block weekend">
          <h2 className="chapter">This weekend</h2>
          {weekend.length === 0 && <p className="survey" style={{ marginTop: 8 }}>No public plans yet.</p>}
          {weekend.map((c) => {
            const trail = c.outing ? getTrail(c.outing.trailId) : undefined
            if (!c.outing || !trail) return null
            return (
              <Link key={c.id} to={`/trail/${trail.id}`} className="hairline" style={{ display: 'block', padding: '14px 0' }}>
                <span style={{ fontWeight: 800, display: 'block' }}>{trail.name}</span>
                <span className="survey">
                  {c.name} · {c.outing.when} · {c.outing.pace} · {c.outing.meet}
                  {c.outing.seats !== undefined ? ` · ${Math.max(0, c.outing.seats - c.outing.going.length)} seats left` : ''}
                  {c.outing.openToSolo ? ' · Solo hikers welcome' : ' · Crew only'}
                </span>
              </Link>
            )
          })}
        </section>

        <section className="lodge-block changed">
          <h2 className="chapter">What changed</h2>
          <p className="survey" style={{ marginTop: 6 }}>Reports from the lodge, newest first. They fade on the trail after a week.</p>
          {changed.map((c) => {
            const trail = getTrail(c.trailId)
            return (
              <div key={c.id} className="hairline" style={{ padding: '14px 0' }}>
                <Link to={`/trail/${c.trailId}`}>
                  <span style={{ fontWeight: 800, display: 'block' }}>{trail?.name}</span>
                  <span className="survey">{c.tags.join(' · ')} · {getHiker(c.userId)?.name} · {relativeTime(c.timestamp)}</span>
                  {c.note && <span style={{ display: 'block', marginTop: 4 }}>{c.note}</span>}
                </Link>
                <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => confirmCondition(c.id)}>
                  Still true · {c.confirms}
                </button>
              </div>
            )
          })}
        </section>

        <section className="lodge-block notes">
          <h2 className="chapter">Notes on the trails</h2>
          <p className="survey" style={{ marginTop: 6 }}>Questions and advice stay on the trail they belong to, and show up in the pack list.</p>
          {notes.map((r) => {
            const trail = getTrail(r.trailId)
            return (
              <Link key={r.id} to={`/trail/${r.trailId}`} className="hairline" style={{ display: 'block', padding: '14px 0' }}>
                <span className="survey">{trail?.name} · {getHiker(r.userId)?.name}</span>
                <span style={{ display: 'block', marginTop: 4, lineHeight: 1.4 }}>{r.text}</span>
              </Link>
            )
          })}
          <p className="survey" style={{ marginTop: 16 }}>Ask the lodge</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8 }}>
            {trails.map((t) => (
              <button key={t.id} type="button" className={`chip ${askTrail === t.id ? 'active' : ''}`} onClick={() => setAskTrail(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
          <input
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            placeholder="Ask about this trail"
            aria-label="Question"
            style={{ width: '100%', marginTop: 10, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
          />
          <button
            className="btn btn-larch"
            style={{ width: '100%', marginTop: 10 }}
            disabled={askText.trim().length < 3}
            onClick={() => {
              addQuestion(askTrail, askText)
              setAskText('')
            }}
          >
            Post on the trail
          </button>
        </section>

        {canIssue && (
          <section style={{ marginTop: 28 }}>
            <h2 className="chapter">Challenge another crew</h2>
            <p className="survey" style={{ marginTop: 6 }}>They accept on this page. Average per person, over the next 30 days.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {lodgeCrews.filter((c) => !mine.some((m) => m.id === c.id)).map((c) => (
                <button key={c.id} type="button" className={`chip ${opponent === c.id ? 'active' : ''}`} onClick={() => setOpponent(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button
                className="btn btn-larch"
                disabled={!opponent}
                onClick={() => {
                  issueDuel(lodge.id, mine[0].id, opponent, 'elevation')
                  setOpponent('')
                }}
              >
                Elevation
              </button>
              <button
                className="btn btn-ghost"
                disabled={!opponent}
                onClick={() => {
                  issueDuel(lodge.id, mine[0].id, opponent, 'distance')
                  setOpponent('')
                }}
              >
                Distance
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Score({ name, score, metric, lead }: { name: string; score: { average: number; total: number; out: number; roster: number }; metric: LodgeMetric; lead: boolean }) {
  return (
    <div style={{ padding: 12, borderRadius: 16, background: lead ? 'rgba(217,119,6,0.12)' : 'rgba(10,138,130,0.08)' }}>
      <p className="survey">{lead ? 'Ahead' : 'Crew'}</p>
      <p style={{ fontWeight: 800, marginTop: 4 }}>{name}</p>
      <p className="num" style={{ fontWeight: 800, fontSize: 'var(--type-lg)', marginTop: 6 }}>{formatMetric(metric, score.average)}</p>
      <p className="survey">per person · {formatMetric(metric, score.total)} total · {score.out}/{score.roster} out</p>
    </div>
  )
}
