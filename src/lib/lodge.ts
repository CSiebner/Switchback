import type { Crew, CrewDuel, Lodge, LodgeMetric, Run } from '../data/seed'
import { getTrail } from '../data/trails'

export interface CrewScore {
  crewId: string
  total: number
  average: number
  out: number
  roster: number
}

export interface HikerScore {
  userId: string
  total: number
  hikes: number
}

function valueOf(run: Run, metric: LodgeMetric) {
  const trail = getTrail(run.trailId)
  if (!trail) return 0
  return metric === 'elevation' ? trail.gainM : trail.distKm
}

function counts(run: Run, startMs: number, endMs: number) {
  return run.timestamp >= startMs && run.timestamp < endMs
}

export function crewScore(crew: Crew, runs: Run[], metric: LodgeMetric, startMs: number, endMs: number): CrewScore {
  const seen = new Set<string>()
  let total = 0
  for (const run of runs) {
    if (!crew.members.includes(run.userId) || !counts(run, startMs, endMs)) continue
    total += valueOf(run, metric)
    seen.add(run.userId)
  }
  const roster = crew.members.length
  return { crewId: crew.id, total, average: roster ? total / roster : 0, out: seen.size, roster }
}

export function hikerScores(memberIds: string[], runs: Run[], metric: LodgeMetric, startMs: number, endMs: number): HikerScore[] {
  const totals = new Map<string, HikerScore>()
  for (const id of memberIds) totals.set(id, { userId: id, total: 0, hikes: 0 })
  for (const run of runs) {
    const row = totals.get(run.userId)
    if (!row || !counts(run, startMs, endMs)) continue
    row.total += valueOf(run, metric)
    row.hikes += 1
  }
  return [...totals.values()].sort((a, b) => b.total - a.total || b.hikes - a.hikes)
}

export function formatMetric(metric: LodgeMetric, value: number) {
  if (metric === 'elevation') return `${Math.round(value).toLocaleString('en-US')} m`
  return `${value.toFixed(1)} km`
}

export function activeDuel(duels: CrewDuel[], lodgeId: string) {
  return duels.find((d) => d.lodgeId === lodgeId && d.status === 'active')
}

export function primaryLodge(lodges: Lodge[]) {
  return lodges.find((l) => l.id === 'bow-valley') ?? lodges[0]
}
