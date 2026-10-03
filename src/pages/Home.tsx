import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RouteGlyph } from '../components/RouteGlyph'
import { heroPhoto } from '../data/photos'
import { WeatherWeek } from '../components/WeatherWeek'
import { PackAdvice } from '../components/PackAdvice'
import { CURRENT_USER_ID, getHiker, type Run } from '../data/seed'
import { getTrail } from '../data/trails'
import { formatTime, relativeTime } from '../lib/format'
import { activeDuel, crewScore, formatMetric, hikerScores, primaryLodge } from '../lib/lodge'
import { useAppStore } from '../store/useAppStore'
import { Fact, StatMark } from '../components/StatMark'

function dayLine(run: Run) {
  const sky = run.weather ? `${run.weather.temp}° ${run.weather.sky.toLowerCase()}` : null
  const ground = run.conditions.join(', ').toLowerCase()
  return sky ? `${sky}, ${ground}` : ground
}

function versusPrevious(latest: Run, previous: Run | undefined) {
  if (!previous) return 'This is your first saved day on this trail. The next one will sit beside it, weather included.'
  const delta = latest.timeSec - previous.timeSec
  const clock =
    delta === 0 ? 'The same clock time as' : delta < 0 ? `${formatTime(-delta)} faster than` : `${formatTime(delta)} slower than`
  const same = latest.conditions.join() === previous.conditions.join()
  return `${clock} your previous ${formatTime(previous.timeSec)} (${dayLine(previous)}). ${
    same ? 'The conditions were similar, so the times can be read together.' : 'The days were different, so keep both: one hike in those conditions, and this one in these.'
  }`
}

export function Home() {
  const runs = useAppStore((s) => s.runs)
  const crews = useAppStore((s) => s.crews)
  const joined = useAppStore((s) => s.joinedCrewIds)
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)
  const weightKg = useAppStore((s) => s.weightKg)
  const heightCm = useAppStore((s) => s.heightCm)
  const lodges = useAppStore((s) => s.lodges)
  const duels = useAppStore((s) => s.duels)

  const season = useMemo(() => {
    const mine = runs.filter((r) => r.userId === CURRENT_USER_ID)
    let km = 0
    let gain = 0
    const lines = new Set<string>()
    for (const run of mine) {
      const trail = getTrail(run.trailId)
      km += trail?.distKm ?? 0
      gain += trail?.gainM ?? 0
      lines.add(run.trailId)
    }
    return { hikes: mine.length, km, gain, lines: lines.size }
  }, [runs])

  const mine = useMemo(
    () => runs.filter((r) => r.userId === CURRENT_USER_ID).sort((a, b) => b.timestamp - a.timestamp),
    [runs],
  )
  const last = mine[0]
  const lastTrail = last ? getTrail(last.trailId) : undefined
  const previous = last ? mine.find((r) => r.trailId === last.trailId && r.id !== last.id) : undefined
  const lastPhoto = lastTrail ? heroPhoto(lastTrail.id) : undefined

  const crew = crews.find((c) => joined.includes(c.id) && c.outing)
  const outing = crew?.outing
  const outingTrail = outing ? getTrail(outing.trailId) : undefined
  const known = outingTrail ? runs.some((r) => r.userId === 'you' && r.trailId === outingTrail.id) : false
  const going = !!outing?.going.includes('you')
  const packTrail = going && outingTrail ? outingTrail : lastTrail
  const lodge = primaryLodge(lodges)
  const duel = lodge ? activeDuel(duels, lodge.id) : undefined
  const lodgeLine = (() => {
    if (!lodge || !duel) return ''
    const a = crews.find((c) => c.id === duel.fromCrewId)
    const b = crews.find((c) => c.id === duel.toCrewId)
    const inDuel = a && b && joined.some((id) => id === a.id || id === b.id)
    if (inDuel && a && b) {
      const as = crewScore(a, runs, duel.metric, duel.startMs, duel.endMs)
      const bs = crewScore(b, runs, duel.metric, duel.startMs, duel.endMs)
      const ahead = as.average >= bs.average ? a : b
      const behind = ahead.id === a.id ? b : a
      const aheadScore = ahead.id === a.id ? as : bs
      const behindScore = ahead.id === a.id ? bs : as
      return `${ahead.name} leads ${behind.name} on ${duel.metric}, ${formatMetric(duel.metric, aheadScore.average)} per person to ${formatMetric(duel.metric, behindScore.average)}.`
    }
    const rows = hikerScores(lodge.memberIds, runs, 'distance', duel.startMs, duel.endMs)
    const rank = rows.findIndex((r) => r.userId === 'you') + 1
    return rank ? `You are #${rank} in the ${lodge.name} on distance over the last 30 days.` : ''
  })()

  return (
    <div className="page">
      {last && lastTrail && (
        <section>
          <div style={{ position: 'relative', height: 240 }}>
            {lastPhoto && <img src={lastPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.05), rgba(11,23,22,0.78))' }} />
            <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, color: 'var(--rock-flour)' }}>
              <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>Your day · {relativeTime(last.timestamp)} · {dayLine(last)}</p>
              <h2 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>{lastTrail.name}</h2>
              <p className="stat-inline light">
                <span><StatMark kind="time" />{formatTime(last.timeSec)}</span>
                <span><StatMark kind="distance" />{lastTrail.distKm.toFixed(1)} km</span>
                <span><StatMark kind="climb" />{Math.round(lastTrail.gainM)} m</span>
              </p>
            </div>
          </div>
          <div className="container page-pad">
            <p style={{ lineHeight: 1.45 }}>{versusPrevious(last, previous)}</p>
            <Link to={`/hike/${last.id}`} className="survey" style={{ display: 'inline-block', marginTop: 8, color: 'var(--glacier)' }}>Open this hike</Link>
            <div style={{ marginTop: 12 }}>
              <WeatherWeek lat={lastTrail.center[1]} lng={lastTrail.center[0]} compact />
            </div>
          </div>
        </section>
      )}

      {packTrail && (
        <div className="container page-pad">
          <PackAdvice
            trail={packTrail}
            runs={runs}
            weightKg={weightKg ?? 70}
            heightCm={heightCm}
            saved={heightCm !== undefined || weightKg !== undefined}
            startOpen
          />
        </div>
      )}

      {crew && outing && outingTrail && (
        <section className="tr-weather" style={{ margin: '28px 0 0', padding: '22px 20px' }}>
          <div className="container">
            <p className="survey">With your crew</p>
            <h2 className="chapter" style={{ marginTop: 4 }}>{crew.name}</h2>
            <p className="survey" style={{ marginTop: 6 }}>The plan, the seats, and what you learned stay with the group. Skip this when you go alone.</p>
            <Link to={`/trail/${outingTrail.id}`} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', marginTop: 14 }}>
              <RouteGlyph coords={outingTrail.path} size={44} stroke="#e4eeeb" strokeWidth={2} />
              <span>
                <span className="fact-value" style={{ color: 'var(--rock-flour)', display: 'block' }}>{outingTrail.name}</span>
                <span className="survey" style={{ display: 'block', marginTop: 4 }}>{outing.when} · {outing.pace} · {known ? "You've hiked this" : 'New to you'}</span>
              </span>
            </Link>
            <p className="survey" style={{ marginTop: 12 }}>
              {outing.meet} · {getHiker(outing.driver ?? '')?.name ?? 'No driver yet'} driving
              {outing.seats !== undefined ? ` · ${Math.max(0, outing.seats - outing.going.length)} seats left` : ''}
            </p>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className={`chip ${going ? 'active' : ''}`} onClick={() => setOutingGoing(crew.id, !going)}>
                {going ? "You're going" : "I'm in"}
              </button>
              <Link to="/crews" className="btn btn-ghost" style={{ flex: 1 }}>Open the crew</Link>
            </div>
          </div>
        </section>
      )}

      {lodge && lodgeLine && (
        <section className="container page-pad">
          <Link to={`/lodge/${lodge.id}`}>
            <p className="survey">The lodge</p>
            <p style={{ fontWeight: 800, marginTop: 4 }}>{lodge.name}</p>
            <p style={{ marginTop: 6, lineHeight: 1.45 }}>{lodgeLine}</p>
          </Link>
        </section>
      )}

      <section className="container page-pad" style={{ marginTop: 8 }}>
        <h2 className="chapter">Your season</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 12px', marginTop: 16 }}>
          <Fact kind="distance" value={season.km.toFixed(1)} label="km hiked" />
          <Fact kind="climb" value={Math.round(season.gain).toLocaleString('en-US')} label="metres up" />
          <Fact kind="hikes" value={String(season.hikes)} label="hikes" />
        </div>
        <p className="survey" style={{ marginTop: 16 }}>
          {season.lines} {season.lines === 1 ? 'trail' : 'trails'} ·{' '}
          <Link to="/you" style={{ color: 'var(--glacier)' }}>Open your profile</Link>
        </p>
      </section>
    </div>
  )
}
