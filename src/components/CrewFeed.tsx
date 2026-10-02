import { useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CURRENT_USER_ID, getHiker, type FeedItem } from '../data/seed'
import { getTrail } from '../data/trails'
import { relativeTime, formatTime } from '../lib/format'
import { heroPhoto } from '../data/photos'
import { RouteGlyph } from './RouteGlyph'
import { bestTime, useAppStore } from '../store/useAppStore'
import { useState } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

function outingRows(text: string) {
  const parts = text.split(' · ').map((part) => part.trim()).filter(Boolean)
  const pace = parts.find((part) => /^(easy|steady|pushing)$/i.test(part))
  const when = parts.find((part) => part !== pace && !/^meet at /i.test(part))
  const meet = parts.find((part) => /^meet at /i.test(part))?.replace(/^meet at /i, '')
  if (!pace && !meet) return [{ k: 'Plan', v: text }]
  const rows = [
    when ? { k: 'When', v: when } : null,
    pace ? { k: 'Pace', v: pace } : null,
    meet ? { k: 'Meet', v: meet } : null,
  ].filter(Boolean) as { k: string; v: string }[]
  return rows
}

const TYPE_LABEL: Record<FeedItem['type'], string> = {
  pb: 'personal best',
  hike: 'hike',
  condition: 'dirt report',
  outing: 'planned hike',
}

export function CrewFeed({ pin, hideOutings = false }: { pin?: ReactNode; hideOutings?: boolean }) {
  const feed = useAppStore((s) => s.feed)
  const runs = useAppStore((s) => s.runs)
  const toggleKudo = useAppStore((s) => s.toggleKudo)
  const addComment = useAppStore((s) => s.addComment)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const items = useMemo(
    () => [...feed].filter((item) => !(hideOutings && item.type === 'outing')).sort((a, b) => b.timestamp - a.timestamp),
    [feed, hideOutings],
  )

  return (
    <section className="cr-feed">
      <h2 className="chapter">From your crew</h2>
      {pin && <div className="cr-pin">{pin}</div>}
      {items.map((item, i) => {
        const hiker = getHiker(item.userId)
        const trail = item.trailId ? getTrail(item.trailId) : undefined
        const isMe = item.userId === CURRENT_USER_ID
        const kind = item.type === 'outing' ? 'plan' : isMe ? 'mine' : 'friend'
        const loved = item.kudos.includes(CURRENT_USER_ID)
        const photo = trail ? heroPhoto(trail.id) : undefined
        const time = trail ? bestTime(runs, item.userId, trail.id) : undefined
        return (
          <motion.article
            key={item.id}
            className={`cr-card ${kind}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
          >
            {photo && (
              <img src={photo.thumb} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 16, marginBottom: 12 }} />
            )}
            <span className="survey cr-kicker">
              {kind === 'plan' ? 'Planned hike' : kind === 'mine' ? 'Your post' : 'From the crew'}
            </span>
            <div className="cr-row">
            {trail ? (
              <Link to={`/trail/${trail.id}`} className="cr-glyph" aria-label={trail.name}>
                <RouteGlyph coords={trail.path} size={44} strokeWidth={2} />
              </Link>
            ) : (
              <span className={`cr-initials ${isMe ? 'me' : ''}`}>{hiker?.initials ?? '??'}</span>
            )}
            <div className="cr-text">
              {item.type === 'outing' ? (
                <>
                  <span className="cr-name">{trail?.name ?? 'Planned hike'}</span>
                  <div className="plan-list">
                    {outingRows(item.text).map((row) => (
                      <div key={row.k} className="plan-row">
                        <span className="plan-k">{row.k}</span>
                        <p className="plan-v">{row.v}</p>
                      </div>
                    ))}
                  </div>
                  <span className="survey num">{relativeTime(item.timestamp)}</span>
                </>
              ) : (
                <>
                  <span className="cr-body">
                    <span className={`cr-name ${item.type === 'pb' ? 'pb' : ''}`}>{isMe ? 'You' : (hiker?.name ?? 'Hiker')}</span>{' '}
                    {item.text}
                  </span>
                  <span className="survey num">
                    {relativeTime(item.timestamp)} · {TYPE_LABEL[item.type]}
                    {trail ? ` · ${trail.name}` : ''}
                  </span>
                </>
              )}
            </div>
            <button
              className={`kudo cr-kudo ${loved ? 'loved' : ''}`}
              aria-pressed={loved}
              aria-label={`Kudos, ${item.kudos.length}`}
              onClick={() => toggleKudo(item.id)}
            >
              <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <path d="M6 1 11 10H1z" />
              </svg>
              {item.kudos.length > 0 && <span className="num">{item.kudos.length}</span>}
            </button>
            </div>
            {trail && time !== undefined && (
              <p className="num" style={{ marginTop: 8, fontWeight: 800 }}>
                {formatTime(time)} · {trail.distKm.toFixed(1)} km · {Math.round(trail.gainM)} m
              </p>
            )}
            {(item.comments ?? []).map((c) => (
              <p key={c.id} className="survey" style={{ marginTop: 8 }}>
                <strong>{getHiker(c.userId)?.name}</strong> {c.text}
              </p>
            ))}
            {openId === item.id ? (
              <form
                style={{ display: 'flex', gap: 8, marginTop: 10 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  const text = (drafts[item.id] ?? '').trim()
                  if (!text) return
                  addComment(item.id, text)
                  setDrafts((d) => ({ ...d, [item.id]: '' }))
                  setOpenId(null)
                }}
              >
                <input
                  value={drafts[item.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                  placeholder="Say something about the hike"
                  aria-label="Comment"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 999, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
                />
                <button className="chip active" type="submit">Send</button>
              </form>
            ) : (
              <button type="button" className="chip" style={{ marginTop: 10 }} onClick={() => setOpenId(item.id)}>
                Comment
              </button>
            )}
          </motion.article>
        )
      })}
    </section>
  )
}
