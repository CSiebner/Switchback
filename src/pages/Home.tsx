import { Link } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { RouteGlyph } from '../components/RouteGlyph'
import { PhotoRail } from '../components/PhotoRail'
import { heroPhoto } from '../data/photos'
import { WeatherWeek } from '../components/WeatherWeek'
import { formatSplit } from '../components/Split'
import { CURRENT_USER_ID, getHiker } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { formatDuration, formatTime, relativeTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

export function Home() {
  const runs = useAppStore((s) => s.runs)
  const pinnedChase = useAppStore((s) => s.chase)
  const feed = useAppStore((s) => s.feed)
  const setChase = useAppStore((s) => s.setChase)
  const crews = useAppStore((s) => s.crews)
  const joined = useAppStore((s) => s.joinedCrewIds)
  const setOutingGoing = useAppStore((s) => s.setOutingGoing)

  const rivals = trails
    .map((tr) => {
      const pb = bestTime(runs, 'you', tr.id)
      if (!pb) return null
      const board = leaderboard(runs, tr.id)
      const idx = board.findIndex((r) => r.userId === 'you')
      const ahead = idx > 0 ? board[idx - 1] : undefined
      if (!ahead) return null
      return { trail: tr, ahead, gap: pb - ahead.timeSec }
    })
    .filter(Boolean)
    .sort((a, b) => a!.gap - b!.gap) as { trail: (typeof trails)[0]; ahead: { userId: string; timeSec: number }; gap: number }[]

  // No pinned ghost? The board promotes whoever is closest ahead of you, so there is always a next move.
  const nextRival = rivals[0]
  const chase =
    pinnedChase ??
    (nextRival
      ? {
          trailId: nextRival.trail.id,
          userId: nextRival.ahead.userId,
          timeSec: nextRival.ahead.timeSec,
          label: getHiker(nextRival.ahead.userId)?.name ?? 'Rival',
        }
      : undefined)

  const yourTrails = trails.filter((tr) => runs.some((r) => r.userId === 'you' && r.trailId === tr.id))
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
      <section>
        {last && lastTrail ? (
          <>
            <div style={{ position: 'relative', height: 300 }}>
              {photo && (
                <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.05) 0%, rgba(11,23,22,0.15) 40%, rgba(11,23,22,0.72) 100%)' }} />
              <div style={{ position: 'absolute', left: 20, right: 20, bottom: 64 }}>
                <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>Last hike · {relativeTime(last.timestamp)} · {lastTrail.region}</p>
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

      {(() => {
        const crew = crews.find((c) => joined.includes(c.id) && c.outing)
        const outing = crew?.outing
        const outingTrail = outing ? getTrail(outing.trailId) : undefined
        if (!crew || !outing || !outingTrail) return null
        return (
          <section className="container page-pad" style={{ marginTop: 8 }}>
            <p className="survey">With your crew</p>
            <Link to={`/trail/${outingTrail.id}`} className="hairline" style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', padding: '16px 0' }}>
              <RouteGlyph coords={outingTrail.path} size={44} stroke="#0f201e" strokeWidth={2} />
              <span>
                <span style={{ fontWeight: 800, display: 'block' }}>{outingTrail.name}</span>
                <span className="survey" style={{ display: 'block', marginTop: 4 }}>{outing.when} · {outing.pace}</span>
                <span className="survey" style={{ display: 'block' }}>{outing.meet} · {getHiker(outing.driver ?? '')?.name} driving</span>
                <span className="survey" style={{ display: 'block' }}>
                  {outing.going.map((id) => getHiker(id)?.name).filter(Boolean).join(', ')}
                  {outing.seats !== undefined ? ` · ${Math.max(0, outing.seats - outing.going.length)} seats left` : ''}
                </span>
              </span>
            </Link>
            <button
              className={`chip ${outing.going.includes('you') ? 'active' : ''}`}
              style={{ marginTop: 8 }}
              onClick={() => setOutingGoing(crew.id, !outing.going.includes('you'))}
            >
              {outing.going.includes('you') ? 'Going' : "I'm in"}
            </button>
          </section>
        )
      })()}

      {lastTrail && (
        <section className="container page-pad" style={{ marginTop: 8 }}>
          <p className="survey">On {lastTrail.name}</p>
          <div style={{ marginTop: 10 }}>
            <PhotoRail trailId={lastTrail.id} />
          </div>
        </section>
      )}

      {rivals.length > 0 && (
        <section className="container page-pad" style={{ marginTop: 12 }}>
          <p className="survey">Faster on your lines</p>
          <div style={{ marginTop: 8 }}>
            {rivals
              .filter((r) => !(chase && r.trail.id === chase.trailId && r.ahead.userId === chase.userId))
              .slice(0, 3)
              .map(({ trail, ahead, gap: g }) => (
              <div
                key={trail.id}
                className="hairline"
                style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 0' }}
              >
                <RouteGlyph coords={trail.path} size={48} stroke="#0f201e" strokeWidth={2} />
                <div>
                  <p style={{ fontWeight: 800 }}>{getHiker(ahead.userId)?.name}</p>
                  <p className="survey num">
                    {formatSplit(g).replace('+', '')} ahead · {trail.name}
                  </p>
                </div>
                <button
                  className="chip"
                  onClick={() =>
                    setChase({
                      trailId: trail.id,
                      userId: ahead.userId,
                      timeSec: ahead.timeSec,
                      label: getHiker(ahead.userId)?.name ?? 'Rival',
                    })
                  }
                >
                  Their time
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container page-pad" style={{ marginTop: 24 }}>
        <p className="survey">Your lines</p>
        <div style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingTop: 12, paddingBottom: 6 }}>
          {yourTrails.map((tr) => {
            const pb = bestTime(runs, 'you', tr.id)
            const yours = runs.filter((r) => r.userId === 'you' && r.trailId === tr.id).sort((a, b) => a.timestamp - b.timestamp)
            const trend = yours.length > 1 ? yours[0].timeSec - (pb ?? 0) : 0
            const holdsPb = leaderboard(runs, tr.id)[0]?.userId === 'you'
            return (
              <Link key={tr.id} to={`/trail/${tr.id}`} style={{ minWidth: 128, flexShrink: 0 }}>
                <div className="panel" style={{ padding: 12, aspectRatio: '1', display: 'grid', placeItems: 'center' }}>
                  <RouteGlyph coords={tr.path} size={88} stroke={holdsPb ? '#d97706' : '#0a8a82'} strokeWidth={2.6} />
                </div>
                <p style={{ fontWeight: 800, marginTop: 8, fontSize: 'var(--type-sm)' }}>{tr.name}</p>
                <p className="survey num">
                  {pb ? formatTime(pb) : '—'}
                  {trend > 0 ? ` · ▼${formatTime(trend)}` : ''}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="container page-pad" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p className="survey">On your dirt</p>
          <Link to="/crews" className="survey" style={{ color: 'var(--glacier)' }}>
            crews →
          </Link>
        </div>
        <div style={{ marginTop: 6 }}>
          {feed.slice(0, 4).map((item) => {
            const user = getHiker(item.userId)
            const tr = item.trailId ? getTrail(item.trailId) : undefined
            return (
              <div
                key={item.id}
                className="hairline"
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 0' }}
              >
                {tr ? (
                  <RouteGlyph coords={tr.path} size={40} stroke={item.type === 'pb' ? '#d97706' : '#5a6f6b'} strokeWidth={1.8} animate={false} />
                ) : (
                  <span />
                )}
                <div>
                  <p style={{ fontSize: 'var(--type-md)', lineHeight: 1.3 }}>
                    <strong>{user?.name}</strong>{' '}
                    <span className="muted">{item.text}</span>
                  </p>
                  <p className="survey">{tr?.name} · {relativeTime(item.timestamp)}</p>
                </div>
                <span className="survey">▲ {item.kudos.length}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
