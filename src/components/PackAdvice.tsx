import { useEffect, useState } from 'react'
import type { Run, Trail } from '../data/seed'
import { expectedMin, litresFor, packFor, personalCalories, paceFactor } from '../lib/bodyPlan'
import { fetchForecast } from '../lib/weather'
import { StatMark } from './StatMark'

/** Water, calories, and a short pack list from your body, your pace, and today's sky. */
export function PackAdvice({
  trail,
  runs,
  weightKg,
  heightCm,
  saved,
}: {
  trail: Trail
  runs: Run[]
  weightKg: number
  heightCm?: number
  saved: boolean
}) {
  const [open, setOpen] = useState(false)
  const [sky, setSky] = useState<{ temp: number; code: number; wind: number } | null>(null)

  useEffect(() => {
    let live = true
    fetchForecast(trail.center[1], trail.center[0])
      .then((f) => live && setSky({ temp: f.temp, code: f.code, wind: f.wind }))
      .catch(() => live && setSky(null))
    return () => {
      live = false
    }
  }, [trail.center])

  const minutes = expectedMin(trail, runs, weightKg, heightCm ?? 175)
  const litres = litresFor(minutes, sky?.temp ?? null, trail.gainM)
  const onThisLine = runs.some((r) => r.userId === 'you' && r.trailId === trail.id)
  const kcal = personalCalories(minutes, trail.gainM, weightKg)
  const items = packFor({
    minutes,
    gainM: trail.gainM,
    distKm: trail.distKm,
    difficulty: trail.difficulty,
    tempC: sky?.temp ?? null,
    code: sky?.code ?? null,
    wind: sky?.wind ?? null,
    litres,
  })
  const personal = paceFactor(runs) !== null

  return (
    <section style={{ marginTop: 22 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          background: 'none',
          border: 'none',
          padding: '8px 0',
          cursor: 'pointer',
          color: 'inherit',
          textAlign: 'left',
        }}
      >
        <span>
          <span className="chapter">What to bring</span>
          <span className="stat-inline">
            <span><StatMark kind="water" />{litres} L</span>
            <span><StatMark kind="heat" />{kcal.toLocaleString()} kcal</span>
          </span>
        </span>
        <span style={{ fontWeight: 800, color: 'var(--glacier-deep)' }}>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 8 }}>
          <p className="survey" style={{ marginTop: 4 }}>
            {onThisLine
              ? 'From your times on this trail'
              : personal
                ? 'From your pace on other trails'
                : 'From the guide time until you log a hike'}
            {saved ? `, at ${heightCm ?? 175} cm and ${weightKg} kg` : ', at 175 cm and 70 kg until you set yours'}.
            A planning estimate, not medical advice.
          </p>
          <ul style={{ margin: '12px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
