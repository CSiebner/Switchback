import { useState } from 'react'
import { motion } from 'framer-motion'
import { getHiker, type ConditionTag } from '../data/seed'
import { conditionConfidence, relativeTime } from '../lib/format'
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

export function TrailDirt({ trailId }: { trailId: string }) {
  const conditions = useAppStore((s) => s.conditions)
  const confirmCondition = useAppStore((s) => s.confirmCondition)
  const addCondition = useAppStore((s) => s.addCondition)
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<ConditionTag[]>([])
  const [note, setNote] = useState('')

  const reports = conditions
    .filter((c) => c.trailId === trailId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((c) => ({ ...c, conf: conditionConfidence(c.timestamp, c.confirms) }))

  const post = () => {
    if (!tags.length) return
    addCondition(trailId, tags, note.trim() || undefined)
    setTags([])
    setNote('')
    setOpen(false)
  }

  return (
    <section className="tr-section">
      <span className="survey head">Dirt report · reports fade after a week</span>
      <div>
        {reports.length === 0 && (
          <p className="survey hairline" style={{ padding: '16px 0' }}>No reports yet · be the first on this dirt</p>
        )}
        {reports.map((c, i) => {
          const expired = c.conf < 0.15
          const done = confirmed.includes(c.id)
          const name = getHiker(c.userId)?.name ?? 'Hiker'
          return (
            <motion.div
              key={c.id}
              className={`hairline tr-dirt ${expired ? 'expired' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: expired ? 0.45 : 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.tags.map((t) => (
                    <span key={t} className="tr-tag">{t}</span>
                  ))}
                </div>
                {c.note && <p style={{ marginTop: 8, fontSize: 'var(--type-md)', lineHeight: 1.4 }}>{c.note}</p>}
                <p className="survey" style={{ marginTop: 6 }}>
                  {name} · {relativeTime(c.timestamp)} · {c.confirms} confirms{expired ? ' · expired' : ''}
                </p>
              </div>
              <button
                className="chip tr-confirm"
                disabled={done}
                onClick={() => {
                  confirmCondition(c.id)
                  setConfirmed((p) => [...p, c.id])
                }}
              >
                {done ? 'Confirmed' : 'Confirm'}
              </button>
              <div className="tr-fresh" aria-hidden>
                <motion.i
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(c.conf * 100)}%` }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.04 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="hairline" style={{ paddingTop: 16 }}>
        {!open ? (
          <button className="btn btn-ghost" onClick={() => setOpen(true)}>Report dirt</button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="survey">How is the dirt right now?</span>
            <div className="tr-grid">
              {CONDITIONS.map(({ tag, glyph }) => {
                const on = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    className={`tr-cell ${on ? 'on' : ''}`}
                    aria-pressed={on}
                    onClick={() => setTags((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]))}
                  >
                    <span className="g">{glyph}</span>
                    <span className="t">{tag}</span>
                  </button>
                )
              })}
            </div>
            <input
              className="tr-input"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={140}
            />
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn btn-glacier" disabled={!tags.length} onClick={post}>Post report</button>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
