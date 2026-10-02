import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { RouteGlyph } from '../components/RouteGlyph'
import { heroPhoto } from '../data/photos'
import { WeatherWeek } from '../components/WeatherWeek'
import { CURRENT_USER_ID, getHiker } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { formatDuration, formatTime, relativeTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { useAppStore } from '../store/useAppStore'
import { Fact, StatMark } from '../components/StatMark'
import { formatSplit } from '../components/Split'
import { Standings, yourStandings } from '../components/Standings'

function givenName(name: string) {
  return name.replace(/\s+\S\.$/, '').split(' ')[0] || name
}

export function Home() {
  const runs = useAppStore((s) => s.runs)
  const crews = useAppStore((s) => s.crews)
  const joined = useAppStore((s) => s.joinedCrewIds)
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)
  const setChase = useAppStore((s) => s.setChase)
  const navigate = useNavigate()

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

  const last = [...runs].filter((r) => r.userId === CURRENT_USER_ID).sort((a, b) => b.timestamp - a.timestamp)[0]
  const lastTrail = last ? getTrail(last.trailId) : undefined
  const lastPace = last && lastTrail ? formatPace(effortFor(lastTrail, last.timeSec).paceSecPerKm) : undefined
  const lastPhoto = lastTrail ? heroPhoto(lastTrail.id) : undefined

  const board = useMemo(() => yourStandings(runs), [runs])
  const next = useMemo(
    () => [...board].filter((row) => row.ahead).sort((a, b) => a.ahead!.gap - b.ahead!.gap)[0],
    [board],
  )
  const nextTrail = next ? getTrail(next.trailId) : undefined
  const fresh = trails.find((t) => !runs.some((r) => r.userId === 'you' && r.trailId === t.id))
  const heroTrail = nextTrail ?? fresh
  const heroPhotoSrc = heroTrail ? heroPhoto(heroTrail.id) : undefined
  const rivalName = next?.ahead ? givenName(next.ahead.name) : undefined

  return (
    <div className="page">
      <section className="container page-pad home-lead">
        <h1 className="display home-lead-title">Go back. Get faster. Go with your crew.</h1>
        <p className="home-lead-body">
          For trails you hike more than once. Your time, the person just ahead, and the people you go with.
        </p>
        <ol className="home-loop">
          <li>
            <span>1</span>
            <strong>Your time</strong>
            Race yourself first.
          </li>
          <li>
            <span>2</span>
            <strong>Who&apos;s ahead</strong>
            Catch one person.
          </li>
          <li>
            <span>3</span>
            <strong>Your crew</strong>
            Who you go with.
          </li>
        </ol>
        <Link to="/about" className="home-lead-more">
          How it works
        </Link>
      </section>

      {heroTrail && heroPhotoSrc && (
        <section>
          <div style={{ position: 'relative', height: 280 }}>
            <img src={heroPhotoSrc.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.12), rgba(11,23,22,0.78))' }} />
            <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, color: 'var(--rock-flour)' }}>
              <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>
                {next && rivalName ? `Next move · ${formatSplit(next.ahead!.gap).replace('+', '')} behind ${next.ahead!.name}` : `Start here · ${heroTrail.region}`}
              </p>
              <h2 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>{heroTrail.name}</h2>
              <p className="stat-inline light">
                <span>{heroTrail.difficulty}</span>
                <span><StatMark kind="distance" />{heroTrail.distKm.toFixed(1)} km</span>
                <span><StatMark kind="climb" />{Math.round(heroTrail.gainM)} m</span>
                <span><StatMark kind="time" />{next ? formatTime(next.timeSec) : formatDuration(heroTrail.typicalMin)}</span>
              </p>
            </div>
          </div>
          <div className="container page-pad" style={{ marginTop: 14 }}>
            <p className="home-lead-body" style={{ marginTop: 0 }}>
              {next && rivalName
                ? `Race ${rivalName}'s time, or hike your own.`
                : 'Hike it once. After that, this spot shows the person just ahead of you.'}
            </p>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <Link to={`/trail/${heroTrail.id}`} className="btn btn-ghost" style={{ flex: 1 }}>See the trail</Link>
              <button
                type="button"
                className="btn btn-larch"
                style={{ flex: 1.3 }}
                onClick={() => {
                  if (next?.ahead) {
                    setChase({
                      trailId: next.trailId,
                      userId: next.ahead.userId,
                      timeSec: next.ahead.timeSec,
                      label: next.ahead.name,
                    })
                    navigate(`/record?trail=${heroTrail.id}&against=1`)
                    return
                  }
                  navigate(`/record?trail=${heroTrail.id}`)
                }}
              >
                {rivalName ? `Race ${rivalName}` : 'Start this hike'}
              </button>
            </div>
          </div>
        </section>
      )}

      {(() => {
        const crew = crews.find((c) => joined.includes(c.id) && c.outing)
        const outing = crew?.outing
        const outingTrail = outing ? getTrail(outing.trailId) : undefined
        if (!crew || !outing || !outingTrail) return null
        const known = runs.some((r) => r.userId === 'you' && r.trailId === outingTrail.id)
        const going = outing.going.includes('you')
        return (
          <section className="tr-weather" style={{ margin: '28px 0 0', padding: '22px 20px' }}>
            <div className="container">
              <p className="survey">With your crew</p>
              <h2 className="chapter" style={{ marginTop: 4 }}>{crew.name}</h2>
              <p className="survey" style={{ marginTop: 6 }}>A crew is the people you hike with — a plan, a meeting spot, and a pace.</p>
              <Link to={`/trail/${outingTrail.id}`} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', marginTop: 14 }}>
                <RouteGlyph coords={outingTrail.path} size={44} stroke="#e4eeeb" strokeWidth={2} />
                <span>
                  <span className="fact-value" style={{ color: 'var(--rock-flour)', display: 'block' }}>{outingTrail.name}</span>
                  <span className="survey" style={{ display: 'block', marginTop: 4 }}>{known ? "You've hiked this" : 'New to you'} · {outing.when}</span>
                </span>
              </Link>
              <div className="plan-list">
                <div className="plan-row">
                  <span className="plan-k">When</span>
                  <p className="plan-v">{outing.when}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Pace</span>
                  <p className="plan-v">{outing.pace}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Meet</span>
                  <p className="plan-v">{outing.meet}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Driving</span>
                  <p className="plan-v">{getHiker(outing.driver ?? '')?.name ?? 'Open'}</p>
                </div>
                <div className="plan-row">
                  <span className="plan-k">Going</span>
                  <p className="plan-v">
                    {outing.going.map((id) => getHiker(id)?.name).filter(Boolean).join(', ')}
                    {outing.seats !== undefined
                      ? ` · ${Math.max(0, outing.seats - outing.going.length)} ${outing.seats - outing.going.length === 1 ? 'seat' : 'seats'} left`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                className={`chip ${going ? 'active' : ''}`}
                style={{ marginTop: 12 }}
                onClick={() => setOutingGoing(crew.id, !going)}
              >
                {going ? "You're going" : "I'm in"}
              </button>
            </div>
          </section>
        )
      })()}

      {last && lastTrail && (
        <section className="container page-pad" style={{ marginTop: 8 }}>
          <h2 className="chapter">Your last hike</h2>
          <Link to={`/hike/${last.id}`} className="home-last">
            {lastPhoto && <img src={lastPhoto.thumb} alt="" />}
            <span>
              <span className="home-last-name">{lastTrail.name}</span>
              <span className="survey" style={{ display: 'block', marginTop: 3 }}>
                {relativeTime(last.timestamp)} · {formatTime(last.timeSec)} · {lastPace}/km
              </span>
            </span>
            <span className="survey">Open</span>
          </Link>
          {lastTrail.id !== heroTrail?.id && (
            <div style={{ marginTop: 14, position: 'relative', height: 180, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(11,23,22,0.18)' }}>
              <TrailMap
                trails={[]}
                route={lastTrail.path}
                mood="day"
                pitch={52}
                fit
                fitPadding={{ top: 24, bottom: 24, left: 24, right: 24 }}
                interactive
              />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <WeatherWeek lat={lastTrail.center[1]} lng={lastTrail.center[0]} compact />
          </div>
          <Link to={`/record?trail=${lastTrail.id}`} className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }}>
            Hike it again
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
          <Link to="/you" style={{ color: 'var(--glacier)' }}>See all your hikes</Link>
        </p>
      </section>

      <section className="container page-pad" style={{ marginTop: 8 }}>
        <Standings
          title="On trails you've hiked"
          hint="Race starts a hike against that person's time."
          rows={board}
        />
      </section>
    </div>
  )
}
