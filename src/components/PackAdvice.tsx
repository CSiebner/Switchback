import { useEffect, useState } from 'react'
import type { Run, Trail } from '../data/seed'
import { expectedMin, litresFor, packFor, packFromReports, personalCalories, paceFactor } from '../lib/bodyPlan'
import { fetchForecast } from '../lib/weather'
import { useAppStore } from '../store/useAppStore'
import { StatMark } from './StatMark'

/** Water, calories, and a short pack list from your body, your pace, the sky, and recent notes. */
export function PackAdvice({
  trail,
  runs,
  weightKg,
  heightCm,
  saved,
  startOpen = false,
}: {
  trail: Trail
  runs: Run[]
  weightKg: number
  heightCm?: number
  saved: boolean
  startOpen?: boolean
}) {
  const [open, setOpen] = useState(startOpen)
  const conditions = useAppStore((s) => s.conditions)
  const reviews = useAppStore((s) => s.reviews)
  const questions = useAppStore((s) => s.questions)
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
  const reports = conditions.filter((c) => c.trailId === trail.id)
  const tags = [...new Set(reports.flatMap((c) => c.tags))]
  const items = [
    ...packFor({
      minutes,
      gainM: trail.gainM,
      distKm: trail.distKm,
      difficulty: trail.difficulty,
      tempC: sky?.temp ?? null,
      code: sky?.code ?? null,
      wind: sky?.wind ?? null,
      litres,
    }),
    ...packFromReports(tags),
  ]
  const voices = [
    ...reports.map((c) => c.note).filter((n): n is string => !!n),
    ...reviews.filter((r) => r.trailId === trail.id).map((r) => r.text),
    ...questions.filter((q) => q.trailId === trail.id).map((q) => q.text),
  ].slice(0, 2)
  const personal = paceFactor(runs) !== null

  return (
    <section id="pack" style={{ marginTop: 22 }}>
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
            {' '}The list also uses today's forecast, the kind of hike this is, and notes from people who were just there.
          </p>
          <ul className="pack-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {voices.length > 0 && (
            <div className="pack-voices">
              <p className="survey">From the trail</p>
              {voices.map((voice) => (
                <p key={voice}>{voice}</p>
              ))}
            </div>
          )}
          <p className="survey" style={{ marginTop: 14, lineHeight: 1.45 }}>
            Water is an estimate from time, climb, and temperature. When a watch can see the water you actually use, that reading replaces the estimate the next time the distance and climb are similar. A planning estimate, not medical advice.
          </p>
        </div>
      )}
    </section>
  )
}
