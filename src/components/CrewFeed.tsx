import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CURRENT_USER_ID, getHiker, type FeedItem } from '../data/seed'
import { getTrail } from '../data/trails'
import { relativeTime } from '../lib/format'
import { RouteGlyph } from './RouteGlyph'
import { useAppStore } from '../store/useAppStore'

const EASE = [0.22, 1, 0.36, 1] as const

const TYPE_LABEL: Record<FeedItem['type'], string> = {
  pb: 'personal best',
  hike: 'hike',
  condition: 'dirt report',
  outing: 'outing',
}

export function CrewFeed() {
  const feed = useAppStore((s) => s.feed)
  const toggleKudo = useAppStore((s) => s.toggleKudo)
  const items = useMemo(() => [...feed].sort((a, b) => b.timestamp - a.timestamp), [feed])

  return (
    <section className="cr-section">
      <span className="survey head">On your dirt</span>
      {items.map((item, i) => {
        const hiker = getHiker(item.userId)
        const trail = item.trailId ? getTrail(item.trailId) : undefined
        const isMe = item.userId === CURRENT_USER_ID
        const loved = item.kudos.includes(CURRENT_USER_ID)
        return (
          <motion.div
            key={item.id}
            className="hairline cr-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
          >
            {trail ? (
              <Link to={`/trail/${trail.id}`} className="cr-glyph" aria-label={trail.name}>
                <RouteGlyph coords={trail.path} size={44} strokeWidth={2} />
              </Link>
            ) : (
              <span className={`cr-initials ${isMe ? 'me' : ''}`}>{hiker?.initials ?? '??'}</span>
            )}
            <div className="cr-text">
              <span className="cr-body">
                <span className={`cr-name ${item.type === 'pb' ? 'pb' : ''}`}>{isMe ? 'You' : (hiker?.name ?? 'Hiker')}</span>{' '}
                {item.text}
              </span>
              <span className="survey num">
                {relativeTime(item.timestamp)} · {TYPE_LABEL[item.type]}
                {trail ? ` · ${trail.name}` : ''}
              </span>
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
          </motion.div>
        )
      })}
    </section>
  )
}
