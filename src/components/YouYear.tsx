import { useMemo, useState } from 'react'
import type { Run } from '../data/seed'
import { getTrail } from '../data/trails'

const LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

/** Distance by month for the current year. Bars are the logbook, not a decoration. */
export function YouYear({ runs }: { runs: Run[] }) {
  const year = new Date().getFullYear()
  const [month, setMonth] = useState<number | null>(null)

  const bars = useMemo(() => {
    const km = Array(12).fill(0)
    const hikes = Array(12).fill(0)
    const gain = Array(12).fill(0)
    for (const r of runs) {
      const d = new Date(r.timestamp)
      if (d.getFullYear() !== year) continue
      const m = d.getMonth()
      const trail = getTrail(r.trailId)
      km[m] += trail?.distKm ?? 0
      gain[m] += trail?.gainM ?? 0
      hikes[m] += 1
    }
    return { km, hikes, gain }
  }, [runs, year])

  const max = Math.max(1, ...bars.km)
  const nowM = new Date().getMonth()
  let monthsActive = 0
  for (let i = nowM; i >= 0; i--) {
    if (bars.hikes[i] === 0) break
    monthsActive++
  }
  let last = -1
  for (let i = nowM; i >= 0; i--) if (bars.km[i] > 0) { last = i; break }
  const selected = month ?? last

  return (
    <section className="yo-section">
      <span className="survey head">{year}{monthsActive > 1 ? ` · ${monthsActive} month streak` : ''}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, alignItems: 'end', height: 96, marginTop: 16 }}>
        {bars.km.map((value, i) => (
          <button
            key={LABELS[i] + i}
            type="button"
            onClick={() => setMonth(i)}
            aria-label={`${LABELS[i]} ${value.toFixed(1)} km`}
            style={{
              height: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'flex-end',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'block',
                width: '100%',
                height: `${Math.max(value > 0 ? 8 : 0, (value / max) * 100)}%`,
                borderRadius: 3,
                background: i === selected ? 'var(--larch)' : 'var(--glacier)',
                opacity: value > 0 ? 1 : 0.25,
              }}
            />
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, marginTop: 6 }}>
        {LABELS.map((l, i) => (
          <span key={l + i} className="survey" style={{ textAlign: 'center' }}>{l}</span>
        ))}
      </div>
      {selected >= 0 && (
        <p className="survey num" style={{ marginTop: 10 }}>
          {LABELS[selected]} · {bars.km[selected].toFixed(1)} km · {bars.hikes[selected]} hikes · {Math.round(bars.gain[selected]).toLocaleString()} m ↑
        </p>
      )}
    </section>
  )
}
