import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { RouteGlyph } from '../components/RouteGlyph'
import { PhotoRail } from '../components/PhotoRail'
import { WeatherWeek } from '../components/WeatherWeek'
import { formatSplit } from '../components/Split'
import { CURRENT_USER_ID, getHiker } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { formatTime, relativeTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

export function Home() {
  const runs = useAppStore((s) => s.runs)
  const pinnedChase = useAppStore((s) => s.chase)
  const feed = useAppStore((s) => s.feed)
  const setChase = useAppStore((s) => s.setChase)

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

  const chaseTrail = chase ? getTrail(chase.trailId) : undefined
  const yourBest = chase ? bestTime(runs, 'you', chase.trailId) : undefined
  const gap = yourBest !== undefined && chase ? yourBest - chase.timeSec : undefined

  const yourTrails = trails.filter((tr) => runs.some((r) => r.userId === 'you' && r.trailId === tr.id))
  const last = [...runs].filter((r) => r.userId === CURRENT_USER_ID).sort((a, b) => b.timestamp - a.timestamp)[0]
  const lastTrail = last ? getTrail(last.trailId) : undefined
  const lastPace = last && lastTrail ? formatPace(effortFor(lastTrail, last.timeSec).paceSecPerKm) : undefined

  return (
    <div className="page">
      <section style={{ position: 'relative', height: '62dvh', minHeight: 440, overflow: 'hidden' }}>
        {lastTrail ? (
          <TrailMap
            trails={[]}
            route={lastTrail.path}
            mood="day"
            pitch={50}
            fit
            fitPadding={{ top: 36, bottom: 200, left: 40, right: 40 }}
            interactive={false}
          />
        ) : (
          <TrailMap trails={trails} mood="day" pitch={45} fit={false} interactive={false} />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(180deg, rgba(228,238,235,0.15) 0%, rgba(228,238,235,0) 28%, rgba(228,238,235,0.8) 72%, rgba(228,238,235,1) 100%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', left: 20, right: 20, bottom: 16 }}
        >
          {last && lastTrail ? (
            <>
              <p className="survey">Last hike · {relativeTime(last.timestamp)} · {lastTrail.region}</p>
              <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 6 }}>
                {lastTrail.name}
              </h1>
              <p className="num" style={{ marginTop: 8, fontWeight: 700 }}>
                {formatTime(last.timeSec)} · {lastTrail.distKm.toFixed(1)} km · {Math.round(lastTrail.gainM)} m ↑ · {lastPace}/km
              </p>
              <div style={{ marginTop: 4 }}>
                <WeatherWeek lat={lastTrail.center[1]} lng={lastTrail.center[0]} compact />
              </div>
              <div className="btn-row" style={{ marginTop: 16 }}>
                <Link to={`/trail/${lastTrail.id}`} className="btn btn-ghost" style={{ flex: 1 }}>
                  The line
                </Link>
                <Link to={`/record?trail=${lastTrail.id}`} className="btn btn-larch" style={{ flex: 1 }}>
                  Hike it again
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95 }}>
                Pick a line.
              </h1>
              <Link to="/explore" className="btn btn-larch" style={{ marginTop: 18, width: '100%' }}>
                Open the map
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {lastTrail && (
        <section className="container page-pad" style={{ marginTop: 8 }}>
          <p className="survey">On {lastTrail.name}</p>
          <div style={{ marginTop: 10 }}>
            <PhotoRail trailId={lastTrail.id} />
          </div>
        </section>
      )}

      {chase && chaseTrail && gap !== undefined && (
        <section className="container page-pad" style={{ marginTop: 18 }}>
          <p className="survey">Someone you know is faster here</p>
          <div className="hairline" style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 0' }}>
            <RouteGlyph coords={chaseTrail.path} size={48} stroke="#0f201e" strokeWidth={2} />
            <div>
              <p style={{ fontWeight: 800 }}>{chase.label}</p>
              <p className="survey num">
                {formatSplit(gap).replace('+', '')} faster · {chaseTrail.name} · their {formatTime(chase.timeSec)}
              </p>
            </div>
            <Link
              to={`/record?trail=${chase.trailId}`}
              className="chip"
              onClick={() => {
                if (!pinnedChase) setChase(chase)
              }}
            >
              Their time
            </Link>
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
