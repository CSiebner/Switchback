import { Link, Navigate, useParams } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { formatTime } from '../lib/format'
import { effortFor, formatPace } from '../lib/effort'
import { getTrail } from '../data/trails'
import { heroPhoto } from '../data/photos'
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
  const photo = heroPhoto(trail.id)

  return (
    <div className="page">
      <div style={{ position: 'relative', height: 280 }}>
        {photo && <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.05), rgba(11,23,22,0.78))' }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 56 }}>
          <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>{trail.region}</p>
          <h1 className="display" style={{ color: 'var(--rock-flour)', fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 4 }}>{trail.name}</h1>
          <p className="display num" style={{ color: 'var(--rock-flour)', fontSize: 'clamp(2.6rem, 12vw, 3.6rem)', fontWeight: 800, lineHeight: 1, marginTop: 6 }}>
            {formatTime(run.timeSec)}
          </p>
        </div>
      </div>
      <div style={{ margin: '-40px 16px 0', position: 'relative', height: 200, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(11,23,22,0.18)' }}>
        <TrailMap trails={[]} route={trail.path} mood="day" pitch={48} fit fitPadding={{ top: 20, bottom: 20, left: 20, right: 20 }} interactive />
      </div>
      <div className="container page-pad" style={{ marginTop: 16 }}>
        <p className="survey">
          {run.weather ? `${run.weather.temp}° ${run.weather.sky.toLowerCase()} · wind ${run.weather.wind} km/h · ` : ''}
          {run.conditions.join(', ').toLowerCase()}
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

        <EffortBadge name={trail.name} timeSec={run.timeSec} mine={mine.map((r) => r.timeSec)} />

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

        <div className="btn-row" style={{ marginTop: 22 }}>
          <Link to={`/trail/${trail.id}`} className="btn btn-ghost" style={{ flex: 1 }}>The line</Link>
          <Link to={`/record?trail=${trail.id}`} className="btn btn-larch" style={{ flex: 1 }}>Go again</Link>
        </div>
      </div>
    </div>
  )
}

function EffortBadge({ name, timeSec, mine }: { name: string; timeSec: number; mine: number[] }) {
  if (mine.length < 2) return null
  const place = mine.filter((t) => t < timeSec).length + 1
  const pct = place / mine.length
  const bucket = mine.length >= 8 ? [5, 10].find((cut) => pct <= cut / 100) : undefined
  const text = bucket
    ? `Top ${bucket}% of the ${mine.length} times you've hiked ${name}.`
    : place === 1
      ? `Your fastest of the ${mine.length} times you've hiked ${name}.`
      : `Your ${ordinal(place)} best of the ${mine.length} times you've hiked ${name}.`
  return (
    <p style={{ margin: '16px 0 0', padding: '11px 14px', borderRadius: 14, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.45)', fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>
      {text}
    </p>
  )
}

function ordinal(n: number) {
  const mod = n % 100
  if (mod >= 11 && mod <= 13) return `${n}th`
  const last = n % 10
  if (last === 1) return `${n}st`
  if (last === 2) return `${n}nd`
  if (last === 3) return `${n}rd`
  return `${n}th`
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
