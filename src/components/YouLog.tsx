import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ConditionTag } from '../data/seed'
import { trails } from '../data/trails'
import { RouteGlyph } from './RouteGlyph'
import { useAppStore } from '../store/useAppStore'

const CONDITIONS: { tag: ConditionTag; glyph: string }[] = [
  { tag: 'Dry', glyph: '☉' },
  { tag: 'Muddy', glyph: '≋' },
  { tag: 'Snow', glyph: '✱' },
  { tag: 'Icy', glyph: '◈' },
  { tag: 'Bugs', glyph: '⁂' },
  { tag: 'Busy', glyph: '⁝⁝' },
]

const EASE = [0.22, 1, 0.36, 1] as const

function parseDuration(input: string): number | undefined {
  const parts = input.trim().split(':')
  if (parts.length < 2 || parts.length > 3) return undefined
  const nums = parts.map((p) => (/^\d{1,2}$/.test(p) ? Number(p) : NaN))
  if (nums.some(Number.isNaN)) return undefined
  const [h, m, s] = parts.length === 3 ? nums : [0, nums[0], nums[1]]
  if (m > 59 && parts.length === 3) return undefined
  if (s > 59) return undefined
  const total = h * 3600 + m * 60 + s
  return total > 0 ? total : undefined
}

export function YouLog() {
  const logManualRun = useAppStore((s) => s.logManualRun)
  const [open, setOpen] = useState(false)
  const [trailId, setTrailId] = useState(trails[0].id)
  const [time, setTime] = useState('')
  const [tags, setTags] = useState<ConditionTag[]>(['Dry'])
  const [touched, setTouched] = useState(false)

  const sec = parseDuration(time)
  const bad = touched && sec === undefined

  const submit = () => {
    setTouched(true)
    if (sec === undefined) return
    logManualRun(trailId, sec, tags)
    setTime('')
    setTags(['Dry'])
    setTouched(false)
    setOpen(false)
  }

  return (
    <section className="yo-section">
      <span className="survey head">Missed recording it?</span>
      {!open ? (
        <button className="btn btn-ghost" onClick={() => setOpen(true)}>Log a hike by hand</button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <span className="survey">Which line?</span>
          <div className="yo-picker" role="radiogroup" aria-label="Trail">
            {trails.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={trailId === t.id}
                className={`chip ${trailId === t.id ? 'active' : ''}`}
                onClick={() => setTrailId(t.id)}
              >
                <RouteGlyph coords={t.path} size={18} strokeWidth={1.8} animate={false} />
                {t.name}
              </button>
            ))}
          </div>

          <input
            className={`yo-input ${bad ? 'bad' : ''}`}
            inputMode="numeric"
            placeholder="Time · mm:ss or h:mm:ss"
            aria-label="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onBlur={() => time && setTouched(true)}
          />
          {bad && <p className="survey" style={{ marginTop: 6, color: 'var(--larch)' }}>Use 47:32 or 1:08:20</p>}

          <span className="survey" style={{ display: 'block', marginTop: 16 }}>How was the dirt?</span>
          <div className="yo-grid">
            {CONDITIONS.map(({ tag, glyph }) => {
              const on = tags.includes(tag)
              return (
                <button
                  key={tag}
                  className={`yo-cell ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  onClick={() => setTags((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]))}
                >
                  <span className="g">{glyph}</span>
                  <span className="t">{tag}</span>
                </button>
              )
            })}
          </div>

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-glacier" onClick={submit}>Add to logbook</button>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </motion.div>
      )}
    </section>
  )
}
