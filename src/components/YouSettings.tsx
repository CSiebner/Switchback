import type { AgeBracket, Experience } from '../data/seed'
import { useAppStore } from '../store/useAppStore'

const AGES: AgeBracket[] = ['18-29', '30-39', '40-49', '50+']
const LEVELS: Experience[] = ['Beginner', 'Intermediate', 'Advanced']

export function YouSettings() {
  const ageBracket = useAppStore((s) => s.ageBracket)
  const experience = useAppStore((s) => s.experience)
  const setAgeBracket = useAppStore((s) => s.setAgeBracket)
  const setExperience = useAppStore((s) => s.setExperience)
  const displayName = useAppStore((s) => s.displayName)
  const setDisplayName = useAppStore((s) => s.setDisplayName)

  return (
    <section className="yo-section">
      <span className="survey head">Your name</span>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="First name"
        aria-label="First name"
        style={{ width: '100%', marginTop: 10, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
      />
      <span className="survey head" style={{ marginTop: 28 }}>Fair rankings use</span>
      <span className="survey yo-seg-label" style={{ marginTop: 0 }}>Age bracket</span>
      <div className="segmented yo-seg">
        {AGES.map((a) => (
          <button
            key={a}
            type="button"
            className={a === ageBracket ? 'active' : ''}
            aria-pressed={a === ageBracket}
            onClick={() => setAgeBracket(a)}
          >
            {a}
          </button>
        ))}
      </div>
      <span className="survey yo-seg-label">Level</span>
      <div className="segmented yo-seg">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            className={l === experience ? 'active' : ''}
            aria-pressed={l === experience}
            onClick={() => setExperience(l)}
          >
            {l}
          </button>
        ))}
      </div>
    </section>
  )
}
