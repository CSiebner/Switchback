import { Link, useNavigate } from 'react-router-dom'
import { CURRENT_USER_ID, getHiker, type Run } from '../data/seed'
import { getTrail, trails } from '../data/trails'
import { formatTime } from '../lib/format'
import { formatSplit } from './Split'
import { leaderboard, useAppStore } from '../store/useAppStore'

export interface Standing {
  trailId: string
  name: string
  rank: number
  field: number
  timeSec: number
  ahead?: { userId: string; name: string; timeSec: number; gap: number }
}

export function yourStandings(runs: Run[]): Standing[] {
  const hiked = new Set(runs.filter((r) => r.userId === CURRENT_USER_ID).map((r) => r.trailId))
  const rows: Standing[] = []
  for (const trail of trails) {
    if (!hiked.has(trail.id)) continue
    const board = leaderboard(runs, trail.id)
    const idx = board.findIndex((r) => r.userId === CURRENT_USER_ID)
    if (idx < 0) continue
    const ahead = idx > 0 ? board[idx - 1] : undefined
    rows.push({
      trailId: trail.id,
      name: getTrail(trail.id)?.name ?? trail.name,
      rank: idx + 1,
      field: board.length,
      timeSec: board[idx].timeSec,
      ahead: ahead
        ? {
            userId: ahead.userId,
            name: getHiker(ahead.userId)?.name ?? 'Hiker',
            timeSec: ahead.timeSec,
            gap: board[idx].timeSec - ahead.timeSec,
          }
        : undefined,
    })
  }
  return rows.sort((a, b) => a.rank - b.rank || (a.ahead?.gap ?? 0) - (b.ahead?.gap ?? 0))
}

/** Where you sit on the lines you have walked, and who is next ahead. */
export function Standings({ title, rows }: { title: string; rows: Standing[] }) {
  const navigate = useNavigate()
  const setChase = useAppStore((s) => s.setChase)

  return (
    <section style={{ marginTop: 36 }}>
      <h2 className="chapter">{title}</h2>
      {rows.length === 0 && (
        <p className="survey" style={{ marginTop: 12 }}>Walk a line and you show up here.</p>
      )}
      <div style={{ marginTop: 8 }}>
        {rows.map((row) => (
          <div
            key={row.trailId}
            className="hairline"
            style={{
              display: 'grid',
              gridTemplateColumns: '42px 1fr auto',
              gap: 10,
              alignItems: 'center',
              padding: '14px 0',
              background: row.rank === 1 ? 'rgba(217,119,6,0.08)' : undefined,
            }}
          >
            <span className="num" style={{ fontWeight: 800, color: row.rank === 1 ? 'var(--larch)' : 'var(--ink)' }}>
              #{row.rank}
            </span>
            <Link to={`/trail/${row.trailId}`}>
              <span style={{ fontWeight: 800, display: 'block' }}>{row.name}</span>
              <span className="fact-label" style={{ display: 'block', marginTop: 3 }}>
                {row.ahead
                  ? `${formatSplit(row.ahead.gap).replace('+', '')} behind ${row.ahead.name} · ${row.field} hikers`
                  : `Holding the line · ${row.field} hikers`}
              </span>
            </Link>
            <span style={{ textAlign: 'right' }}>
              <span className="num" style={{ fontWeight: 800, display: 'block' }}>{formatTime(row.timeSec)}</span>
              {row.ahead && (
                <button
                  type="button"
                  className="chip"
                  style={{ marginTop: 6 }}
                  onClick={() => {
                    setChase({
                      trailId: row.trailId,
                      userId: row.ahead!.userId,
                      timeSec: row.ahead!.timeSec,
                      label: row.ahead!.name,
                    })
                    navigate(`/record?trail=${row.trailId}&against=1`)
                  }}
                >
                  Chase
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
