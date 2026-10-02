import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { TrailMap } from '../components/TrailMap'
import { getTrail } from '../data/trails'
import { heroPhoto } from '../data/photos'
import { formatTime } from '../lib/format'
import { caloriesFor, effortFor, formatPace } from '../lib/effort'
import { useDusk } from '../lib/useMood'
import { useAppStore } from '../store/useAppStore'

/** The end of a hike: the same frame as the record, plus where it landed. */
export function Result() {
  const [result] = useState(() => useAppStore.getState().lastResult)
  const crews = useAppStore((s) => s.crews)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const clearResult = useAppStore((s) => s.clearResult)
  const setChase = useAppStore((s) => s.setChase)
  const navigate = useNavigate()
  useDusk(false)

  if (!result) return <Navigate to="/" replace />
  const trail = getTrail(result.trailId)
  if (!trail) return <Navigate to="/" replace />

  const photo = heroPhoto(trail.id)
  const effort = effortFor(trail, result.timeSec)
  const crew = crews.find((c) => joinedCrewIds.includes(c.id))
  const refSec = result.chase?.timeSec ?? result.previousBest
  const refLabel = result.chase?.label ?? (result.previousBest ? 'your previous best' : undefined)
  const delta = refSec !== undefined ? result.timeSec - refSec : undefined
  const earned =
    delta === undefined
      ? 'First time on this line.'
      : delta < 0
        ? `${formatSpoken(-delta)} faster than ${refLabel}.`
        : delta > 0
          ? `${formatSpoken(delta)} slower than ${refLabel}.`
          : `Same time as ${refLabel}.`

  return (
    <div className="page">
      <div style={{ position: 'relative', height: 280 }}>
        {photo && <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.08), rgba(11,23,22,0.78))' }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 56 }}>
          <p className="survey" style={{ color: 'rgba(228,238,235,0.8)' }}>{trail.region} · finished</p>
          <h1 className="display" style={{ color: 'var(--rock-flour)', fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 4 }}>{trail.name}</h1>
          <p className="display num" style={{ color: 'var(--rock-flour)', fontSize: 'clamp(2.8rem, 12vw, 3.8rem)', fontWeight: 800, lineHeight: 1, marginTop: 6 }}>
            {formatTime(result.timeSec)}
          </p>
        </div>
      </div>
      <div style={{ margin: '-40px 16px 0', position: 'relative', height: 200, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(11,23,22,0.18)' }}>
        <TrailMap trails={[]} route={trail.path} mood="day" pitch={48} fit fitPadding={{ top: 20, bottom: 20, left: 20, right: 20 }} interactive />
      </div>
      <div className="container page-pad" style={{ marginTop: 18 }}>
        <p style={{ paddingLeft: 12, borderLeft: '3px solid var(--larch)', fontWeight: 700, lineHeight: 1.4 }}>{earned}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 22 }}>
          <Fact v={`${trail.distKm.toFixed(1)} km`} l="distance" />
          <Fact v={`${Math.round(trail.gainM)} m`} l="climb" />
          <Fact v={effort.steps.toLocaleString()} l="steps" />
          <Fact v={caloriesFor(result.timeSec, effort.ascentM).toLocaleString()} l="kcal" />
        </div>
        <p className="survey num" style={{ marginTop: 16 }}>
          {formatPace(effort.paceSecPerKm)}/km
          {effort.ascentPaceSec ? ` · ${formatPace(effort.ascentPaceSec)} per 100 m up` : ''}
        </p>
        <div className="btn-row" style={{ marginTop: 28 }}>
          <Link to="/crews" className="btn btn-larch" style={{ flex: 1.4 }} onClick={() => clearResult()}>
            Send to {crew?.name ?? 'crew'}
          </Link>
          <Link to={`/trail/${trail.id}`} className="btn btn-ghost" style={{ flex: 1 }} onClick={() => clearResult()}>
            The line
          </Link>
        </div>
        <button
          className="survey"
          style={{ marginTop: 16, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--glacier-deep)' }}
          onClick={() => {
            setChase({
              trailId: trail.id,
              userId: 'you',
              timeSec: Math.round(result.timeSec * 0.99),
              label: 'your next target',
            })
            clearResult()
            navigate(`/record?trail=${trail.id}&against=1`)
          }}
        >
          Aim 1% faster next time
        </button>
      </div>
    </div>
  )
}

function Fact({ v, l }: { v: string; l: string }) {
  return (
    <div>
      <p className="num" style={{ fontWeight: 800, fontSize: 'var(--type-lg)' }}>{v}</p>
      <p className="survey" style={{ marginTop: 4 }}>{l}</p>
    </div>
  )
}

function formatSpoken(sec: number) {
  const minutes = Math.max(1, Math.round(Math.abs(sec) / 60))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}
