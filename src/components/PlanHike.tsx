import { useState } from 'react'
import { hikers } from '../data/seed'
import { trails } from '../data/trails'
import { useAppStore } from '../store/useAppStore'

const PACES = ['easy', 'steady', 'pushing'] as const

function nextSaturdayMorning() {
  const d = new Date()
  const add = (6 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + add)
  d.setHours(7, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function readableWhen(isoLocal: string) {
  const d = new Date(isoLocal)
  if (Number.isNaN(d.getTime())) return isoLocal
  return d.toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function calendarUrl(title: string, isoLocal: string, meet: string, detail: string) {
  const start = new Date(isoLocal)
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    location: meet,
    details: detail,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}

/** A crew member puts a hike on the calendar: line, time, place, pace, driver. */
export function PlanHike({ crewId }: { crewId: string }) {
  const createOuting = useAppStore((s) => s.createOuting)
  const members = useAppStore((s) => s.crews.find((c) => c.id === crewId)?.members ?? ['you'])
  const [open, setOpen] = useState(false)
  const [trailId, setTrailId] = useState('ha-ling')
  const [when, setWhen] = useState(nextSaturdayMorning)
  const [meet, setMeet] = useState('Canmore Nordic Centre lot')
  const [seats, setSeats] = useState(3)
  const [pace, setPace] = useState<(typeof PACES)[number]>('steady')
  const [driver, setDriver] = useState(members[0] ?? 'you')
  const [posted, setPosted] = useState<{ title: string; when: string; meet: string; detail: string } | null>(null)

  if (!open) {
    return (
      <div style={{ marginTop: 18 }}>
        <button className="btn btn-larch" style={{ width: '100%' }} onClick={() => setOpen(true)}>
          Plan a hike
        </button>
        {posted && (
          <a className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} href={calendarUrl(posted.title, posted.when, posted.meet, posted.detail)} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
        )}
      </div>
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
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        aria-label="Date and time"
        style={{ width: '100%', marginTop: 8, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
      />
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
      <a className="survey" style={{ display: 'inline-block', marginTop: 8, color: 'var(--glacier)' }} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meet)}`} target="_blank" rel="noreferrer">
        Open in Google Maps
      </a>
      <p className="survey" style={{ marginTop: 14 }}>Seats in the car</p>
      <input
        type="number"
        min={0}
        max={8}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value))}
        aria-label="Seats"
        style={{ width: 88, marginTop: 8, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
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
            const label = readableWhen(when)
            const title = `${trails.find((t) => t.id === trailId)?.name ?? 'Hike'} · ${pace}`
            createOuting(crewId, { trailId, when: label, meet: meet.trim(), pace, driver, seats, whenIso: new Date(when).toISOString() })
            setPosted({ title, when, meet: meet.trim(), detail: `${pace} · ${seats} seats` })
            setOpen(false)
          }}
        >
          Post to the crew
        </button>
      </div>
    </section>
  )
}
