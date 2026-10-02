import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CURRENT_USER_ID, getHiker } from '../data/seed'
import { formatTime } from '../lib/format'
import { formatSplit } from './Split'
import { leaderboard, useAppStore } from '../store/useAppStore'

type Filter = 'all' | 'age' | 'level' | 'dry' | 'improved'

interface Row {
  userId: string
  timeSec: number
  improved: number
}

const EASE = [0.22, 1, 0.36, 1] as const

export function TrailBoard({ trailId }: { trailId: string }) {
  const navigate = useNavigate()
  const runs = useAppStore((s) => s.runs)
  const ageBracket = useAppStore((s) => s.ageBracket)
  const experience = useAppStore((s) => s.experience)
  const setChase = useAppStore((s) => s.setChase)
  const [filter, setFilter] = useState<Filter>('all')

  const rows: Row[] = useMemo(() => {
    const mapRows = (list: ReturnType<typeof leaderboard>): Row[] =>
      list.map((r) => ({ userId: r.userId, timeSec: r.timeSec, improved: r.improved ?? 0 }))
    if (filter === 'age') return mapRows(leaderboard(runs, trailId, (u) => getHiker(u)?.age === ageBracket))
    if (filter === 'level') return mapRows(leaderboard(runs, trailId, (u) => getHiker(u)?.level === experience))
    if (filter === 'dry') {
      return mapRows(leaderboard(runs.filter((r) => r.conditions.includes('Dry')), trailId))
    }
    const all = mapRows(leaderboard(runs, trailId))
    if (filter === 'improved') {
      const firstTime = new Map<string, { ts: number; sec: number }>()
      for (const r of runs.filter((x) => x.trailId === trailId)) {
        const cur = firstTime.get(r.userId)
        if (!cur || r.timestamp < cur.ts) firstTime.set(r.userId, { ts: r.timestamp, sec: r.timeSec })
      }
      return all
        .map((r) => ({ ...r, improved: Math.max(0, (firstTime.get(r.userId)?.sec ?? r.timeSec) - r.timeSec) }))
        .sort((a, b) => b.improved - a.improved || a.timeSec - b.timeSec)
    }
    return all
  }, [runs, trailId, filter, ageBracket, experience])

  const myIdx = rows.findIndex((r) => r.userId === CURRENT_USER_ID)
  const myTime = myIdx >= 0 ? rows[myIdx].timeSec : undefined
  const iAmFirst = myIdx === 0

  const options: [Filter, string][] = [
    ['all', 'All'],
    ['age', `My age (${ageBracket})`],
    ['level', `My level (${experience})`],
    ['dry', 'Dry days'],
    ['improved', 'Most improved'],
  ]

  const chase = (r: Row) => {
    const name = getHiker(r.userId)?.name ?? 'Rival'
    setChase({ trailId, userId: r.userId, timeSec: r.timeSec, label: name })
    navigate(`/record?trail=${trailId}`)
  }

  return (
    <section className="tr-section">
      <span className="survey head">Local board · {rows.length} hikers</span>
      <div className="segmented tr-seg" role="tablist">
        {options.map(([key, label]) => (
          <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        {rows.length === 0 && <p className="survey hairline" style={{ padding: '16px 0' }}>No one on this board yet</p>}
        {rows.map((r, i) => {
          const hiker = getHiker(r.userId)
          const isMe = r.userId === CURRENT_USER_ID
          const name = isMe ? 'You' : (hiker?.name ?? r.userId)
          const first = i === 0
          const faster = myTime !== undefined && !isMe && r.timeSec < myTime
          const slower = myTime !== undefined && !isMe && r.timeSec > myTime
          const tint = isMe ? (iAmFirst ? 'rgba(217,119,6,.08)' : 'rgba(10,138,130,.08)') : undefined
          return (
            <motion.div
              key={`${filter}-${r.userId}`}
              className="hairline tr-board-row"
              style={{ background: tint }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
            >
              <span className={`tr-rank num ${first ? 'first' : ''}`}>#{i + 1}</span>
              <span className={`tr-disc ${isMe ? 'me' : ''}`}>{hiker?.initials ?? '??'}</span>
              <span className={`tr-name ${isMe ? 'me' : ''}`}>
                {name}
                {filter === 'improved' && r.improved > 0 && (
                  <span className="survey" style={{ display: 'block', fontWeight: 600 }}>
                    improved {formatSplit(-r.improved)}
                  </span>
                )}
              </span>
              <span className="tr-time num">{formatTime(r.timeSec)}</span>
              <span className="tr-act">
                {faster && (
                  <button className="chip tr-chase" onClick={() => chase(r)}>
                    Chase
                  </button>
                )}
                {slower && myTime !== undefined && (
                  <span className="survey num">+{formatTime(r.timeSec - myTime)}</span>
                )}
              </span>
            </motion.div>
          )
        })}
        {myIdx < 0 && rows.length > 0 && (
          <p className="survey hairline" style={{ padding: '14px 0' }}>
            {runsHaveMine(runs, trailId) ? `You're not on this board` : 'Record once to join the board'}
          </p>
        )}
      </div>
    </section>
  )
}

function runsHaveMine(runs: { userId: string; trailId: string }[], trailId: string) {
  return runs.some((r) => r.userId === CURRENT_USER_ID && r.trailId === trailId)
}
