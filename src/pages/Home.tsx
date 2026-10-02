import { Link } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { RouteGlyph } from '../components/RouteGlyph'
import { heroPhoto } from '../data/photos'
import { WeatherWeek } from '../components/WeatherWeek'
import { CURRENT_USER_ID, getHiker } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { formatDuration, formatTime, relativeTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { useAppStore } from '../store/useAppStore'

export function Home() {
  const runs = useAppStore((s) => s.runs)
  const crews = useAppStore((s) => s.crews)
  const joined = useAppStore((s) => s.joinedCrewIds)
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)

  const last = [...runs].filter((r) => r.userId === CURRENT_USER_ID).sort((a, b) => b.timestamp - a.timestamp)[0]
  const lastTrail = last ? getTrail(last.trailId) : undefined
  const lastPace = last && lastTrail ? formatPace(effortFor(lastTrail, last.timeSec).paceSecPerKm) : undefined
  const photo = lastTrail ? heroPhoto(lastTrail.id) : undefined

  const fresh = trails.find((t) => !runs.some((r) => r.userId === 'you' && r.trailId === t.id))
  const freshPhoto = fresh ? heroPhoto(fresh.id) : undefined

  return (
    <div className="page">
      {fresh && (
        <section>
          <div style={{ position: 'relative', height: 280 }}>
            {freshPhoto && <img src={freshPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.12), rgba(11,23,22,0.78))' }} />
            <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, color: 'var(--rock-flour)' }}>
              <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>New to you · {fresh.region}</p>
              <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>{fresh.name}</h1>
              <p className="survey num" style={{ marginTop: 8, color: 'rgba(228,238,235,0.85)' }}>
                {fresh.difficulty} · {fresh.distKm.toFixed(1)} km · {Math.round(fresh.gainM)} m ↑ · about {formatDuration(fresh.typicalMin)}
              </p>
            </div>
          </div>
          <div className="container page-pad" style={{ marginTop: 14 }}>
            <div className="btn-row">
              <Link to={`/trail/${fresh.id}`} className="btn btn-ghost" style={{ flex: 1 }}>See the trail</Link>
              <Link to={`/record?trail=${fresh.id}`} className="btn btn-larch" style={{ flex: 1.3 }}>Hike this line</Link>
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
        return (
          <section className="tr-weather" style={{ margin: '28px 0 0', padding: '22px 20px' }}>
            <div className="container">
              <p className="survey">Saturday with your crew</p>
              <Link to={`/trail/${outingTrail.id}`} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', marginTop: 12 }}>
                <RouteGlyph coords={outingTrail.path} size={44} stroke="#e4eeeb" strokeWidth={2} />
                <span>
                  <span style={{ fontWeight: 800, display: 'block' }}>{outingTrail.name}</span>
                  <span className="survey" style={{ display: 'block', marginTop: 4 }}>{known ? "You've walked this" : 'New to you'} · {outing.when} · {outing.pace}</span>
                  <span className="survey" style={{ display: 'block' }}>{outing.meet} · {getHiker(outing.driver ?? '')?.name} driving</span>
                  <span className="survey" style={{ display: 'block' }}>
                    {outing.going.map((id) => getHiker(id)?.name).filter(Boolean).join(', ')}
                    {outing.seats !== undefined ? ` · ${Math.max(0, outing.seats - outing.going.length)} seats left` : ''}
                  </span>
                </span>
              </Link>
              <button
                className={`chip ${outing.going.includes('you') ? 'active' : ''}`}
                style={{ marginTop: 12 }}
                onClick={() => setOutingGoing(crew.id, !outing.going.includes('you'))}
              >
                {outing.going.includes('you') ? 'Going' : "I'm in"}
              </button>
            </div>
          </section>
        )
      })()}

      <section style={{ marginTop: 28 }}>
        {last && lastTrail ? (
          <>
            <div style={{ position: 'relative', height: 300 }}>
              {photo && (
                <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.05) 0%, rgba(11,23,22,0.15) 40%, rgba(11,23,22,0.72) 100%)' }} />
              <div style={{ position: 'absolute', left: 20, right: 20, bottom: 64 }}>
                <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>Your last hike · {relativeTime(last.timestamp)} · {lastTrail.region}</p>
                <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6, color: 'var(--rock-flour)' }}>
                  {lastTrail.name}
                </h1>
                <p className="num" style={{ marginTop: 8, fontWeight: 700, color: 'var(--rock-flour)' }}>
                  {formatTime(last.timeSec)} · {lastTrail.distKm.toFixed(1)} km · {Math.round(lastTrail.gainM)} m ↑ · {lastPace}/km
                </p>
              </div>
            </div>
            <div style={{ margin: '-48px 16px 0', position: 'relative', height: 230, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(11,23,22,0.18)' }}>
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
            <div className="container page-pad" style={{ marginTop: 14 }}>
              <WeatherWeek lat={lastTrail.center[1]} lng={lastTrail.center[0]} compact />
              <div className="btn-row" style={{ marginTop: 12 }}>
                <Link to={`/hike/${last.id}`} className="btn btn-ghost" style={{ flex: 1 }}>The hike</Link>
                <Link to={`/record?trail=${lastTrail.id}`} className="btn btn-larch" style={{ flex: 1 }}>Hike it again</Link>
              </div>
            </div>
          </>
        ) : (
          <div className="container page-pad">
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800 }}>Pick a line.</h1>
            <Link to="/explore" className="btn btn-larch" style={{ marginTop: 18, width: '100%' }}>Open the map</Link>
          </div>
        )}
      </section>

    </div>
  )
}
