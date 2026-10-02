import { Link, Navigate, useParams } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { PhotoRail } from '../components/PhotoRail'
import { formatTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { getTrail } from '../data/trails'
import { useAppStore } from '../store/useAppStore'

export function Hike() {
  const { id } = useParams()
  const runs = useAppStore((s) => s.runs)
  const run = runs.find((r) => r.id === id)
  if (!run) return <Navigate to="/" replace />
  const trail = getTrail(run.trailId)
  if (!trail) return <Navigate to="/" replace />

  const effort = effortFor(trail, run.movingSec ?? run.timeSec)
  const mine = runs
    .filter((r) => r.userId === run.userId && r.trailId === trail.id)
    .sort((a, b) => a.timestamp - b.timestamp)
  const prev = mine.filter((r) => r.timestamp < run.timestamp).at(-1)
  const prevDelta = prev ? run.timeSec - prev.timeSec : undefined
  const moving = run.movingSec ?? run.timeSec
  const stopped = Math.max(0, run.timeSec - moving)
  const maxSplit = Math.max(...effort.splits.map((s) => s.sec), 1)
  const maxVert = Math.max(...effort.vertical.map((v) => v.sec), 1)

  return (
    <div className="page">
      <section style={{ position: 'relative', height: '46dvh', minHeight: 320 }}>
        <TrailMap
          trails={[]}
          route={trail.path}
          mood="day"
          pitch={48}
          fit
          fitPadding={{ top: 28, bottom: 48, left: 36, right: 36 }}
          interactive
        />
      </section>
      <div className="container page-pad" style={{ marginTop: -28, position: 'relative' }}>
        <PhotoRail trailId={trail.id} />
        <p className="survey" style={{ marginTop: 16 }}>
          {trail.region}
          {run.weather ? ` · ${run.weather.temp}° ${run.weather.sky.toLowerCase()} · wind ${run.weather.wind} km/h` : ''}
          {run.conditions.length ? ` · ${run.conditions.join(', ').toLowerCase()}` : ''}
        </p>
        <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 6 }}>{trail.name}</h1>
        <p className="display num" style={{ fontSize: 'clamp(3rem, 14vw, 4.2rem)', fontWeight: 800, lineHeight: 0.95, marginTop: 8 }}>
          {formatTime(run.timeSec)}
        </p>
        <p className="survey num" style={{ marginTop: 8 }}>
          moving {formatTime(moving)}
          {stopped > 30 ? ` · stopped ${formatTime(stopped)}` : ''}
          {' · '}{formatPace(effort.paceSecPerKm)}/km · grade {formatPace(effort.gapSecPerKm)}/km
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
          <Stat v={`${trail.distKm.toFixed(1)} km`} l="distance" />
          <Stat v={`${Math.round(trail.gainM)} m`} l="gain" />
          <Stat v={effort.ascentPaceSec ? `${formatPace(effort.ascentPaceSec)}` : '—'} l="per 100 m up" />
        </div>

        {prev && prevDelta !== undefined && (
          <p style={{ marginTop: 18, fontWeight: 700 }}>
            {prevDelta < 0 ? `${formatTime(-prevDelta)} faster` : prevDelta > 0 ? `${formatTime(prevDelta)} slower` : 'Same time'} than your previous {formatTime(prev.timeSec)} on this line.
          </p>
        )}

        <p className="survey" style={{ marginTop: 22 }}>Kilometres</p>
        {effort.splits.map((s) => (
          <Bar key={s.km} label={String(s.km)} width={s.sec / maxSplit} value={`${formatTime(s.sec)} · ${s.gainM} m`} />
        ))}

        <p className="survey" style={{ marginTop: 22 }}>Each 100 m of climb</p>
        {effort.vertical.map((v) => (
          <Bar key={v.fromM} label={`${v.fromM}`} width={v.sec / maxVert} value={formatTime(v.sec)} />
        ))}

        <Link to={`/trail/${trail.id}`} className="btn btn-ghost" style={{ width: '100%', marginTop: 22 }}>
          The line
        </Link>
      </div>
    </div>
  )
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="hairline" style={{ paddingTop: 10 }}>
      <p className="num" style={{ fontWeight: 800 }}>{v}</p>
      <p className="survey">{l}</p>
    </div>
  )
}

function Bar({ label, width, value }: { label: string; width: number; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, alignItems: 'center', marginTop: 8 }}>
      <span className="num survey">{label}</span>
      <span style={{ height: 8, borderRadius: 99, background: 'var(--contour-light)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${Math.max(8, width * 100)}%`, background: 'var(--glacier)' }} />
      </span>
      <span className="num" style={{ fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  )
}
