import { useState } from 'react'
import type { Trail } from '../data/seed'
import { ElevationProfile } from './ElevationProfile'

function readoutAt(trail: Trail, t: number) {
  const e = trail.elevation
  const idx = t * (e.length - 1)
  const i0 = Math.floor(idx)
  const f = idx - i0
  const i1 = Math.min(e.length - 1, i0 + 1)
  let gain = 0
  for (let i = 1; i <= i0; i++) gain += Math.max(0, e[i] - e[i - 1])
  gain += Math.max(0, e[i1] - e[i0]) * f
  const elev = e[i0] + (e[i1] - e[i0]) * f
  return { km: t * trail.distKm, elev, gain }
}

export function TrailElevation({ trail }: { trail: Trail }) {
  const [t, setT] = useState(0)
  const r = readoutAt(trail, t)
  return (
    <section className="tr-section">
      <span className="survey head">Elevation · drag to scrub</span>
      <ElevationProfile elevation={trail.elevation} interactive onScrub={(v) => setT(v)} height={110} />
      <p className="survey num tr-readout">
        km {r.km.toFixed(1)} · {Math.round(r.elev).toLocaleString('en-US')} m · +{Math.round(r.gain)} m so far
      </p>
    </section>
  )
}
