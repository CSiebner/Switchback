import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RouteGlyph } from '../components/RouteGlyph'
import { heroPhoto } from '../data/photos'
import { WeatherWeek } from '../components/WeatherWeek'
import { PackAdvice } from '../components/PackAdvice'
import { CURRENT_USER_ID, getHiker, type Run } from '../data/seed'
import { getTrail } from '../data/trails'
import { formatTime, relativeTime } from '../lib/format'
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
  const outingPhoto = outingTrail ? heroPhoto(outingTrail.id) : undefined
  const known = outingTrail ? runs.some((r) => r.userId === 'you' && r.trailId === outingTrail.id) : false
  const going = !!outing?.going.includes('you')

  return (
    <div className="page">
      <section className="container page-pad home-lead">
        <h1 className="display home-lead-title">Hike with your people. Remember the day. Pack the next one.</h1>
        <p className="home-lead-body">
          AllTrails finds the trail. Strava keeps the workout. Switchback is the crew you go outside with, and it learns what that day asks of you.
        </p>
        <ol className="home-loop">
          <li>
            <span>1</span>
            <strong>Your crew</strong>
            The plan, the car, the people.
          </li>
          <li>
            <span>2</span>
            <strong>Your last time</strong>
            Same trail, with the weather.
          </li>
          <li>
            <span>3</span>
            <strong>What to bring</strong>
            Sky, notes, and how you hike.
          </li>
        </ol>
        <Link to="/about" className="home-lead-more">
          How it works
        </Link>
      </section>

      {crew && outing && outingTrail && outingPhoto && (
        <section>
          <div style={{ position: 'relative', height: 280 }}>
            <img src={outingPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.12), rgba(11,23,22,0.78))' }} />
            <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, color: 'var(--rock-flour)' }}>
              <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>
                {outing.when} · {crew.name}
              </p>
              <h2 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>{outingTrail.name}</h2>
              <p className="stat-inline light">
                <span>{outing.pace}</span>
                <span><StatMark kind="distance" />{outingTrail.distKm.toFixed(1)} km</span>
                <span><StatMark kind="climb" />{Math.round(outingTrail.gainM)} m</span>
                <span>{known ? "You've hiked this" : 'New to the crew'}</span>
              </p>
            </div>
          </div>
          <div className="tr-weather" style={{ margin: 0, padding: '22px 20px' }}>
            <div className="container">
              <p className="survey">With your crew</p>
              <p className="home-lead-body" style={{ color: 'rgba(228,238,235,0.82)', marginTop: 6 }}>
                A crew is the people you actually hike with. The plan, the seats, and what you learned on the trail stay with the group.
              </p>
              <Link to={`/trail/${outingTrail.id}`} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', marginTop: 14 }}>
                <RouteGlyph coords={outingTrail.path} size={44} stroke="#e4eeeb" strokeWidth={2} />
                <span>
                  <span className="fact-value" style={{ color: 'var(--rock-flour)', display: 'block' }}>{outing.meet}</span>
                  <span className="survey" style={{ display: 'block', marginTop: 4 }}>
                    {getHiker(outing.driver ?? '')?.name ?? 'No driver yet'} driving
                    {outing.seats !== undefined
                      ? ` · ${Math.max(0, outing.seats - outing.going.length)} ${outing.seats - outing.going.length === 1 ? 'seat' : 'seats'} left`
                      : ''}
                  </span>
                </span>
              </Link>
              <p className="survey" style={{ marginTop: 12 }}>
                Going · {outing.going.map((id) => getHiker(id)?.name).filter(Boolean).join(', ')}
              </p>
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button
                  className={`chip ${going ? 'active' : ''}`}
                  onClick={() => setOutingGoing(crew.id, !going)}
                >
                  {going ? "You're going" : "I'm in"}
                </button>
                <Link to="/crews" className="btn btn-ghost" style={{ flex: 1 }}>Open the crew</Link>
              </div>
            </div>
          </div>
          <div className="container page-pad">
            <PackAdvice
              trail={outingTrail}
              runs={runs}
              weightKg={weightKg ?? 70}
              heightCm={heightCm}
              saved={heightCm !== undefined || weightKg !== undefined}
              startOpen
            />
          </div>
        </section>
      )}

      {last && lastTrail && (
        <section className="container page-pad" style={{ marginTop: 8 }}>
          <h2 className="chapter">The last time you hiked this</h2>
          <p className="survey" style={{ marginTop: 6 }}>
            Your profile keeps each day next to the one before it, including the weather.
          </p>
          <Link to={`/hike/${last.id}`} className="home-last">
            {lastPhoto && <img src={lastPhoto.thumb} alt="" />}
            <span>
              <span className="home-last-name">{lastTrail.name}</span>
              <span className="survey" style={{ display: 'block', marginTop: 3 }}>
                {relativeTime(last.timestamp)} · {formatTime(last.timeSec)} · {dayLine(last)}
              </span>
            </span>
            <span className="survey">Open</span>
          </Link>
          <p style={{ marginTop: 12, lineHeight: 1.45 }}>{versusPrevious(last, previous)}</p>
          <div style={{ marginTop: 12 }}>
            <WeatherWeek lat={lastTrail.center[1]} lng={lastTrail.center[0]} compact />
          </div>
          <Link to={`/trail/${lastTrail.id}#pack`} className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }}>
            Pack for next time
          </Link>
        </section>
      )}

      <section className="container page-pad" style={{ marginTop: 8 }}>
        <h2 className="chapter">Your season with the crew</h2>
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
