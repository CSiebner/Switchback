import { useState } from 'react'
import { trails } from '../data/trails'
import { useAppStore } from '../store/useAppStore'

const WHEN = ['Sat 7:00 AM', 'Sat 9:30 AM', 'Sun 8:00 AM', 'Wed 6:00 PM']

/** A crew member puts a hike on the calendar. Members then mark "I'm in". */
export function PlanHike({ crewId }: { crewId: string }) {
  const createOuting = useAppStore((s) => s.createOuting)
  const [open, setOpen] = useState(false)
  const [trailId, setTrailId] = useState(trails[0]?.id ?? 'ha-ling')
  const [when, setWhen] = useState(WHEN[0])
  const [posted, setPosted] = useState(false)

  if (!open) {
    return (
      <button className="btn btn-larch" style={{ width: '100%', marginTop: 18 }} onClick={() => setOpen(true)}>
        Plan a hike
      </button>
    )
  }

  return (
    <section style={{ marginTop: 18 }}>
      <p className="survey">Plan a hike</p>
      <p className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 6 }}>
        Put a line on the calendar.
      </p>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 0', scrollbarWidth: 'none' }}>
        {trails.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${t.id === trailId ? 'active' : ''}`}
            onClick={() => setTrailId(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {WHEN.map((w) => (
          <button key={w} type="button" className={`chip ${w === when ? 'active' : ''}`} onClick={() => setWhen(w)}>
            {w}
          </button>
        ))}
      </div>
      <button
        className="btn btn-larch"
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          createOuting(crewId, trailId, when)
          setPosted(true)
          setOpen(false)
        }}
      >
        Post to the crew
      </button>
      {posted && <p className="survey" style={{ marginTop: 8 }}>It's on the board. Crew can tap I'm in.</p>}
    </section>
  )
}
