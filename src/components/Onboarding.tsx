import { useState } from 'react'
import { trails } from '../data/trails'
import { Mark } from './Mark'
import { RouteGlyph } from './RouteGlyph'
import { useAppStore } from '../store/useAppStore'

const AGES = ['18-29', '30-39', '40-49', '50+'] as const
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

/** One sitting: who you are, trails you know, a fair comparison, and a crew. */
export function Onboarding({ onBack }: { onBack?: () => void }) {
  const finish = useAppStore((s) => s.finishOnboarding)
  const setAge = useAppStore((s) => s.setAgeBracket)
  const setLevel = useAppStore((s) => s.setExperience)
  const createCrew = useAppStore((s) => s.createCrew)
  const setDisplayName = useAppStore((s) => s.setDisplayName)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [known, setKnown] = useState<string[]>(['ha-ling', 'tunnel-mountain'])
  const [age, setAgeLocal] = useState<(typeof AGES)[number]>('30-39')
  const [level, setLevelLocal] = useState<(typeof LEVELS)[number]>('Intermediate')
  const [crewName, setCrewName] = useState('')
  const [withCrew, setWithCrew] = useState<boolean | null>(null)

  const done = (mode: 'solo' | 'crew') => {
    setAge(age)
    setLevel(level)
    if (name.trim()) setDisplayName(name)
    if (mode === 'crew' && crewName.trim().length > 1) createCrew(crewName.trim(), 'Bow Valley', ['liam', 'maya'])
    finish(known, mode)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--rock-flour)', overflowY: 'auto', padding: 'calc(24px + env(safe-area-inset-top)) 20px 32px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mark />
          {step === 0 && onBack && (
            <button type="button" className="survey" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onBack}>
              Back
            </button>
          )}
        </div>
        <p className="survey" style={{ marginTop: 22 }}>Step {step + 1} of 3</p>
        {step === 0 && (
          <>
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 10, lineHeight: 0.95 }}>
              What should we call you?
            </h1>
            <p className="survey" style={{ marginTop: 12 }}>
              Switchback is the crew you hike with, a memory of your days, and a pack list that learns.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              aria-label="First name"
              style={{ width: '100%', marginTop: 16, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
            />
            <h2 className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 28 }}>
              Which trails have you already hiked?
            </h2>
            <p className="survey" style={{ marginTop: 8 }}>
              We'll keep your days on these, weather included, and use them the next time you pack. Leave off any you haven't walked.
            </p>
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
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 10, lineHeight: 0.95 }}>
              So the day fits how you hike.
            </h1>
            <p className="survey" style={{ marginTop: 12 }}>
              Age and experience shape how long a hike will take you, and what we suggest you bring. You can change this later.
            </p>
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
            <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 10, lineHeight: 0.95 }}>
              On your own, or with a crew.
            </h1>
            <p className="survey" style={{ marginTop: 12 }}>
              Both are a full Switchback. The Bow Valley lodge is open either way. A crew adds a plan and a car.
            </p>
            <div className="btn-row" style={{ marginTop: 16 }}>
              <button type="button" className={`btn ${withCrew === false ? 'btn-larch' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => setWithCrew(false)}>
                On my own
              </button>
              <button type="button" className={`btn ${withCrew === true ? 'btn-larch' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => setWithCrew(true)}>
                With a crew
              </button>
            </div>
            {withCrew === true && (
              <>
                <p className="survey" style={{ marginTop: 16 }}>
                  Calgary Beltliner's can be yours — a Saturday plan and a meeting spot. Name another only if you want one.
                </p>
                <input
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  placeholder="Crew name, optional"
                  aria-label="Crew name"
                  style={{ width: '100%', marginTop: 16, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
                />
              </>
            )}
            {withCrew !== null && (
              <button className="btn btn-larch" style={{ width: '100%', marginTop: 18 }} onClick={() => done(withCrew ? 'crew' : 'solo')}>
                Enter Switchback
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
