import { useState } from 'react'
import { hikers } from '../data/seed'
import { trails } from '../data/trails'
import { useAppStore } from '../store/useAppStore'

const WHEN = ['Sat 7:00 AM', 'Sat 9:30 AM', 'Sun 8:00 AM', 'Wed 6:00 PM']
const PACES = ['easy', 'steady', 'pushing'] as const

/** A crew member puts a hike on the calendar: line, time, place, pace, driver. */
export function PlanHike({ crewId }: { crewId: string }) {
  const createOuting = useAppStore((s) => s.createOuting)
  const members = useAppStore((s) => s.crews.find((c) => c.id === crewId)?.members ?? ['you'])
  const [open, setOpen] = useState(false)
  const [trailId, setTrailId] = useState('ha-ling')
  const [when, setWhen] = useState(WHEN[0])
  const [meet, setMeet] = useState('Canmore Nordic Centre lot')
  const [pace, setPace] = useState<(typeof PACES)[number]>('steady')
  const [driver, setDriver] = useState(members[0] ?? 'you')

  if (!open) {
    return (
      <button className="btn btn-larch" style={{ width: '100%', marginTop: 18 }} onClick={() => setOpen(true)}>
        Plan a hike
      </button>
    )
  }

  const drivers = hikers.filter((h) => members.includes(h.id))

  return (
    <section style={{ marginTop: 18 }}>
      <p className="survey">Plan a hike</p>
      <p className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 6 }}>
        Where, when, and how hard.
      </p>
      <p className="survey" style={{ marginTop: 14 }}>Line</p>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 8, scrollbarWidth: 'none' }}>
        {trails.map((t) => (
          <button key={t.id} type="button" className={`chip ${t.id === trailId ? 'active' : ''}`} onClick={() => setTrailId(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      <p className="survey" style={{ marginTop: 14 }}>When</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {WHEN.map((w) => (
          <button key={w} type="button" className={`chip ${w === when ? 'active' : ''}`} onClick={() => setWhen(w)}>
            {w}
          </button>
        ))}
      </div>
      <p className="survey" style={{ marginTop: 14 }}>Pace</p>
      <div className="segmented" style={{ marginTop: 8 }}>
        {PACES.map((p) => (
          <button key={p} type="button" className={p === pace ? 'active' : ''} onClick={() => setPace(p)}>
            {p}
          </button>
        ))}
      </div>
      <p className="survey" style={{ marginTop: 14 }}>Meet</p>
      <input
        value={meet}
        onChange={(e) => setMeet(e.target.value)}
        aria-label="Meeting point"
        style={{ width: '100%', marginTop: 8, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
      />
      <p className="survey" style={{ marginTop: 14 }}>Driving</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {drivers.map((h) => (
          <button key={h.id} type="button" className={`chip ${h.id === driver ? 'active' : ''}`} onClick={() => setDriver(h.id)}>
            {h.name}
          </button>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>Cancel</button>
        <button
          className="btn btn-larch"
          style={{ flex: 1 }}
          disabled={meet.trim().length < 2}
          onClick={() => {
            createOuting(crewId, { trailId, when, meet: meet.trim(), pace, driver })
            setOpen(false)
          }}
        >
          Post to the crew
        </button>
      </div>
    </section>
  )
}
