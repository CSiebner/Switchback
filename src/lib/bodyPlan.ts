import type { Run, Trail } from '../data/seed'
import { getTrail } from '../data/trails'
import { caloriesFor } from './effort'

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** Your recorded times against each trail's guide time. 1 means you match it. */
export function paceFactor(runs: Run[]): number | null {
  const ratios: number[] = []
  for (const run of runs.filter((r) => r.userId === 'you')) {
    const trail = getTrail(run.trailId)
    if (!trail || trail.typicalMin < 15) continue
    ratios.push(run.timeSec / 60 / trail.typicalMin)
  }
  if (!ratios.length) return null
  return median(ratios)
}

function bodyFactor(weightKg: number, heightCm: number) {
  const weight = 1 + clamp((weightKg - 70) * 0.006, -0.1, 0.18)
  const height = 1 + clamp((175 - heightCm) * 0.0015, -0.06, 0.06)
  return weight * height
}

export function expectedMin(
  trail: Pick<Trail, 'id' | 'typicalMin'>,
  runs: Run[],
  weightKg: number,
  heightCm = 175,
): number {
  const body = bodyFactor(weightKg, heightCm)
  const mine = runs.filter((r) => r.userId === 'you' && r.trailId === trail.id).map((r) => r.timeSec / 60)
  if (mine.length) return Math.max(15, Math.round(median(mine) * body))
  const personal = paceFactor(runs) ?? 1
  return Math.max(15, Math.round(trail.typicalMin * personal * body))
}

/** Litres for the moving time, the climb, and the air temperature. */
export function litresFor(minutes: number, tempC: number | null, gainM: number): number {
  const hours = minutes / 60
  let litres = hours * 0.5 + gainM / 600
  if (tempC !== null && tempC >= 18) litres += hours * 0.25
  if (tempC !== null && tempC >= 26) litres += hours * 0.25
  return Math.max(0.5, Math.round(litres * 2) / 2)
}

export function packFor(opts: {
  minutes: number
  gainM: number
  distKm: number
  difficulty: string
  tempC: number | null
  code: number | null
  wind: number | null
  litres: number
}): string[] {
  const items = [`${opts.litres} L of water`]
  const code = opts.code
  const temp = opts.tempC
  const steep = opts.gainM / Math.max(0.5, opts.distKm) > 130 || opts.difficulty === 'Hard'
  if (code !== null && ((code >= 51 && code < 71) || (code >= 80 && code < 95))) items.push('Rain shell')
  if (code !== null && code >= 71 && code <= 77) items.push('Warm layer and traction for snow')
  if (code !== null && code >= 95) items.push('A plan to turn back if thunder gets close')
  if (temp !== null && temp <= 8) items.push('Insulating layer and gloves')
  else if ((opts.wind ?? 0) >= 25) items.push('Wind shell')
  if (temp !== null && temp >= 18 && (code === null || code <= 3)) items.push('Sun hat and sunscreen')
  if (steep) items.push('Poles')
  if (opts.gainM >= 600 || opts.minutes >= 150) items.push('Extra food')
  if (opts.minutes >= 180) items.push('Headlamp')
  return items
}

/** Extra items from what hikers reported, kept separate from the forecast. */
export function packFromReports(tags: string[]): string[] {
  const items: string[] = []
  if (tags.includes('Icy') || tags.includes('Snow')) items.push('Traction, from recent trail reports')
  if (tags.includes('Muddy')) items.push('Waterproof boots or extra socks — reports say mud')
  if (tags.includes('Bugs')) items.push('Bug spray — reports mention bugs')
  if (tags.includes('Busy')) items.push('An earlier start — reports say it fills up')
  return items
}

export function personalCalories(minutes: number, gainM: number, weightKg: number): number {
  return caloriesFor(minutes * 60, gainM, weightKg)
}
