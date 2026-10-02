import { useState } from 'react'
import { motion } from 'framer-motion'
import { getHiker } from '../data/seed'
import { relativeTime } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const

function Ticks({ value }: { value: number }) {
  return (
    <span className="tr-ticks" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`tr-tick ${n <= value ? 'on' : ''}`} />
      ))}
    </span>
  )
}

export function TrailReviews({ trailId }: { trailId: string }) {
  const reviews = useAppStore((s) => s.reviews)
  const addReview = useAppStore((s) => s.addReview)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')

  const list = reviews.filter((r) => r.trailId === trailId).sort((a, b) => b.timestamp - a.timestamp)
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0

  const post = () => {
    if (!rating) return
    addReview(trailId, rating, text.trim())
    setRating(0)
    setText('')
    setOpen(false)
  }

  return (
    <section className="tr-section">
      <span className="survey head">
        What people wrote · {list.length ? avg.toFixed(1) : '—'} · {list.length}
      </span>
      <div>
        {list.length === 0 && <p className="survey hairline" style={{ padding: '16px 0' }}>No reviews yet</p>}
        {list.map((r, i) => (
          <motion.div
            key={r.id}
            className="hairline"
            style={{ padding: '14px 0' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span className="survey">
                <strong style={{ color: 'var(--ink)', fontWeight: 800 }}>{getHiker(r.userId)?.name ?? 'Hiker'}</strong>
                {' · '}
                {relativeTime(r.timestamp)}
              </span>
              <Ticks value={r.rating} />
            </div>
            {r.text && <p style={{ marginTop: 6, fontSize: 'var(--type-md)', lineHeight: 1.45 }}>{r.text}</p>}
          </motion.div>
        ))}
      </div>

      <div className="hairline" style={{ paddingTop: 16 }}>
        {!open ? (
          <button className="btn btn-ghost" onClick={() => setOpen(true)}>Write a review</button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <span className="survey">Your line · tap to rate</span>
            <div className="tr-pick">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n} of 5`} onClick={() => setRating(n)}>
                  <i className={`tr-tick ${n <= rating ? 'on' : ''}`} />
                </button>
              ))}
            </div>
            <textarea
              className="tr-input"
              rows={3}
              placeholder="What should the next hiker know?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
            />
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn btn-glacier" disabled={!rating} onClick={post}>Post</button>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
