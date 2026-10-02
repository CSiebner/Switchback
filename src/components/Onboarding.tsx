import { useState } from 'react'
import { trails } from '../data/trails'
import { Mark } from './Mark'
import { RouteGlyph } from './RouteGlyph'
import { useAppStore } from '../store/useAppStore'

const AGES = ['18-29', '30-39', '40-49', '50+'] as const
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

/** One sitting: the lines you know, how you hike, and a crew. */
export function Onboarding() {
  const finish = useAppStore((s) => s.finishOnboarding)
  const setAge = useAppStore((s) => s.setAgeBracket)
  const setLevel = useAppStore((s) => s.setExperience)
  const createCrew = useAppStore((s) => s.createCrew)
  const [step, setStep] = useState(0)
  const [known, setKnown] = useState<string[]>(['ha-ling', 'tunnel-mountain'])
  const [age, setAgeLocal] = useState<(typeof AGES)[number]>('30-39')
  const [level, setLevelLocal] = useState<(typeof LEVELS)[number]>('Intermediate')
  const [crewName, setCrewName] = useState('')

  const done = () => {
    setAge(age)
    setLevel(level)
    if (crewName.trim().length > 1) createCrew(crewName.trim(), 'Bow Valley', ['liam', 'maya'])
    finish(known)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--rock-flour)', overflowY: 'auto', padding: 'calc(24px + env(safe-area-inset-top)) 20px 32px' }}>
      <div className="container">
        <Mark />
        {step === 0 && (
          <>
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 28, lineHeight: 0.95 }}>
              Which lines do you already know?
            </h1>
            <div style={{ marginTop: 18 }}>
              {trails.map((t) => {
                const on = known.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setKnown((prev) => (on ? prev.filter((id) => id !== t.id) : [...prev, t.id]))}
                    className="hairline"
                    style={{ width: '100%', display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 0', background: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', textAlign: 'left', color: 'inherit', cursor: 'pointer' }}
                  >
                    <RouteGlyph coords={t.path} size={48} stroke={on ? '#d97706' : '#0f201e'} />
                    <span>
                      <span style={{ fontWeight: 800, display: 'block' }}>{t.name}</span>
                      <span className="survey">{t.region} · {t.distKm.toFixed(1)} km</span>
                    </span>
                    <span className="survey">{on ? 'Known' : 'Add'}</span>
                  </button>
                )
              })}
            </div>
            <button className="btn btn-larch" style={{ width: '100%', marginTop: 18 }} onClick={() => setStep(1)}>
              Continue
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 28, lineHeight: 0.95 }}>
              How should the board compare you?
            </h1>
            <p className="survey" style={{ marginTop: 16 }}>Age</p>
            <div className="segmented" style={{ marginTop: 8 }}>
              {AGES.map((a) => (
                <button key={a} type="button" className={a === age ? 'active' : ''} onClick={() => setAgeLocal(a)}>{a}</button>
              ))}
            </div>
            <p className="survey" style={{ marginTop: 16 }}>Level</p>
            <div className="segmented" style={{ marginTop: 8 }}>
              {LEVELS.map((l) => (
                <button key={l} type="button" className={l === level ? 'active' : ''} onClick={() => setLevelLocal(l)}>{l}</button>
              ))}
            </div>
            <button className="btn btn-larch" style={{ width: '100%', marginTop: 22 }} onClick={() => setStep(2)}>
              Continue
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 28, lineHeight: 0.95 }}>
              Start a crew, or use the one already here.
            </h1>
            <p className="survey" style={{ marginTop: 12 }}>Calgary Beltline Hikers is already yours. A new name starts another.</p>
            <input
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="Crew name, optional"
              aria-label="Crew name"
              style={{ width: '100%', marginTop: 16, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
            />
            <button className="btn btn-larch" style={{ width: '100%', marginTop: 18 }} onClick={done}>
              {crewName.trim().length > 1 ? 'Create and enter' : 'Enter Switchback'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
