import type { ConditionReport, Run, Trail } from '../data/seed'
import { getHiker } from '../data/seed'
import { conditionConfidence, formatDuration, formatGain, formatKm, formatTime } from '../lib/format'
import { bestTime, leaderboard } from '../store/useAppStore'

export interface Rival {
  userId: string
  timeSec: number
  name: string
}

export interface Freshness {
  tags: string[]
  timestamp: number
  conf: number
}

export interface Line {
  trail: Trail
  pb?: number
  rank: number
  boardSize: number
  holds: boolean
  above?: Rival
  below?: Rival
  gap?: number
  chaseable: boolean
  fresh?: Freshness
  freshDirt: boolean
}

export type ExploreFilter = 'All' | 'Easy' | 'Moderate' | 'Hard' | 'Chaseable' | 'Fresh dirt'

export const FILTERS: ExploreFilter[] = ['All', 'Easy', 'Moderate', 'Hard', 'Chaseable', 'Fresh dirt']

const rival = (e: { userId: string; timeSec: number }): Rival => ({
  userId: e.userId,
  timeSec: e.timeSec,
  name: getHiker(e.userId)?.name ?? 'Rival',
})

export function buildLines(trails: Trail[], runs: Run[], conditions: ConditionReport[]): Line[] {
  return trails.map((trail) => {
    const board = leaderboard(runs, trail.id)
    const pb = bestTime(runs, 'you', trail.id)
    const idx = board.findIndex((r) => r.userId === 'you')
    const above = pb !== undefined && idx > 0 ? rival(board[idx - 1]) : undefined
    const below = pb !== undefined && idx >= 0 && idx < board.length - 1 ? rival(board[idx + 1]) : undefined
    const reports = conditions
      .filter((c) => c.trailId === trail.id)
      .map((c) => ({ tags: c.tags as string[], timestamp: c.timestamp, conf: conditionConfidence(c.timestamp, c.confirms) }))
      .sort((a, b) => b.conf - a.conf)
    const top = reports[0]
    return {
      trail,
      pb,
      rank: idx + 1,
      boardSize: board.length,
      holds: idx === 0,
      above,
      below,
      gap: above && pb !== undefined ? pb - above.timeSec : undefined,
      chaseable: !!above,
      fresh: top && top.conf >= 0.15 ? top : undefined,
      freshDirt: !!top && top.conf >= 0.4,
    }
  })
}

export function matchesFilter(line: Line, f: ExploreFilter): boolean {
  if (f === 'All') return true
  if (f === 'Chaseable') return line.chaseable
  if (f === 'Fresh dirt') return line.freshDirt
  return line.trail.difficulty === f
}

/** Chaseable lines by smallest gap, then your other lines, then undone ones. */
export function sortLines(lines: Line[]): Line[] {
  const tier = (l: Line) => (l.chaseable ? 0 : l.pb !== undefined ? 1 : 2)
  return [...lines].sort((a, b) => {
    const t = tier(a) - tier(b)
    if (t !== 0) return t
    if (tier(a) === 0) return (a.gap ?? 0) - (b.gap ?? 0)
    if (tier(a) === 1) return (a.pb ?? 0) - (b.pb ?? 0)
    return a.trail.typicalMin - b.trail.typicalMin
  })
}

export const formatTypical = formatDuration

export function lineStats(t: Trail): string {
  return `${formatKm(t.distKm)} · ${formatGain(t.gainM)} ↑`
}

export function rowSurvey(l: Line): string {
  const tail = l.pb !== undefined ? `best ${formatTime(l.pb)}` : `typical ${formatTypical(l.trail.typicalMin)}`
  return `${lineStats(l.trail)} · ${tail}`
}
