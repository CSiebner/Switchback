import { useState } from 'react'
import { hikers } from '../data/seed'
import { useAppStore } from '../store/useAppStore'

const others = hikers.filter((h) => h.id !== 'you')

/** Name a crew and pull a few people onto it. */
export function StartCrew() {
  const createCrew = useAppStore((s) => s.createCrew)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('Bow Valley')
  const [invited, setInvited] = useState<string[]>([])

  if (!open) {
    return (
      <button type="button" className="survey" style={{ marginTop: 18, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--glacier-deep)' }} onClick={() => setOpen(true)}>
        Start a crew
      </button>
    )
  }

  return (
    <section style={{ marginTop: 18 }}>
      <p className="survey">Start a crew</p>
      <p className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 6 }}>
        People on the same dirt.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Crew name"
        aria-label="Crew name"
        style={{
          width: '100%',
          marginTop: 14,
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--contour-light)',
          background: 'transparent',
          color: 'inherit',
        }}
      />
      <input
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="Where you hike"
        aria-label="Region"
        style={{
          width: '100%',
          marginTop: 8,
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--contour-light)',
          background: 'transparent',
          color: 'inherit',
        }}
      />
      <p className="survey" style={{ marginTop: 14 }}>Invite</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {others.map((h) => {
          const on = invited.includes(h.id)
          return (
            <button
              key={h.id}
              type="button"
              className={`chip ${on ? 'active' : ''}`}
              onClick={() => setInvited((prev) => (on ? prev.filter((id) => id !== h.id) : [...prev, h.id]))}
            >
              {h.name}
            </button>
          )
        })}
      </div>
      <button
        className="btn btn-larch"
        style={{ width: '100%', marginTop: 16 }}
        disabled={name.trim().length < 2}
        onClick={() => {
          createCrew(name, region, invited)
          setOpen(false)
          setName('')
          setInvited([])
        }}
      >
        Create crew
      </button>
    </section>
  )
}
