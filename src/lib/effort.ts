import type { Trail } from '../data/seed'

export interface KmSplit {
  km: number
  sec: number
  gainM: number
}

export interface Effort {
  paceSecPerKm: number
  /** Grade-adjusted pace: the flat pace this effort would equal. */
  gapSecPerKm: number
  ascentM: number
  descentM: number
  /** Seconds per 100 m of climbing. */
  ascentPaceSec: number | null
  /** Seconds per 100 m of descending. */
  descentPaceSec: number | null
  steps: number
  splits: KmSplit[]
  /** Time spent gaining each 100 m. */
  vertical: { fromM: number; sec: number }[]
}

/**
 * Effort from a finished time against the trail's distance and elevation profile.
 * Time is spread by a hiking cost model (steep up costs more than flat, steep down
 * a little more than flat), which is what makes grade-adjusted pace and the
 * ascent/descent split move independently of raw pace.
 */
export function effortFor(trail: Pick<Trail, 'distKm' | 'elevation'>, timeSec: number): Effort {
  const distM = Math.max(1, trail.distKm * 1000)
  const elev = trail.elevation.length >= 2 ? trail.elevation : [0, trail.distKm]
  const seg = distM / (elev.length - 1)

  const costs: number[] = []
  let upM = 0
  let downM = 0
  let totalCost = 0
  for (let i = 1; i < elev.length; i++) {
    const de = elev[i] - elev[i - 1]
    const grade = de / seg
    const factor = grade >= 0 ? 1 + 5 * grade : 1 + 1.4 * Math.abs(grade)
    const cost = seg * Math.max(0.35, factor)
    costs.push(cost)
    totalCost += cost
    if (de > 0) upM += de
    else downM += -de
  }

  const flatTime = totalCost > 0 ? timeSec * (distM / totalCost) : timeSec
  const kmCount = Math.max(1, Math.ceil(trail.distKm - 0.05))
  const buckets = Array.from({ length: kmCount }, () => ({ cost: 0, gain: 0 }))
  let walked = 0
  for (let i = 0; i < costs.length; i++) {
    const de = elev[i + 1] - elev[i]
    let left = seg
    while (left > 0.5 && walked < distM - 0.5) {
      const idx = Math.min(kmCount - 1, Math.floor(walked / 1000))
      const room = Math.min((idx + 1) * 1000 - walked, distM - walked)
      const take = Math.min(left, room)
      const portion = take / seg
      buckets[idx].cost += costs[i] * portion
      if (de > 0) buckets[idx].gain += de * portion
      walked += take
      left -= take
    }
  }

  const upCost = costs.reduce((sum, c, i) => sum + (elev[i + 1] - elev[i] > 0 ? c : 0), 0)
  const downCost = costs.reduce((sum, c, i) => sum + (elev[i + 1] - elev[i] < 0 ? c : 0), 0)
  const stride = Math.max(0.55, 0.78 - (upM / distM) * 0.9)

  const vertical: { fromM: number; sec: number }[] = []
  let climbed = 0
  let bucket = 0
  let mark = 100
  for (let i = 0; i < costs.length; i++) {
    const de = elev[i + 1] - elev[i]
    if (de <= 0) continue
    let left = de
    let leftCost = costs[i]
    while (left > 0.2) {
      const room = mark - climbed
      if (room <= 0.2) {
        mark += 100
        continue
      }
      const take = Math.min(left, room)
      const frac = take / left
      bucket += leftCost * frac
      climbed += take
      left -= take
      leftCost -= leftCost * frac
      if (climbed >= mark - 0.2) {
        vertical.push({ fromM: mark - 100, sec: totalCost > 0 ? Math.round(timeSec * (bucket / totalCost)) : 0 })
        bucket = 0
        mark += 100
      }
    }
  }

  return {
    paceSecPerKm: timeSec / trail.distKm,
    gapSecPerKm: flatTime / trail.distKm,
    ascentM: Math.round(upM),
    descentM: Math.round(downM),
    ascentPaceSec: upM > 30 ? (timeSec * (upCost / totalCost) / upM) * 100 : null,
    descentPaceSec: downM > 30 ? (timeSec * (downCost / totalCost) / downM) * 100 : null,
    steps: Math.round(distM / stride),
    splits: buckets.map((b, i) => ({
      km: i + 1,
      sec: totalCost > 0 ? Math.round(timeSec * (b.cost / totalCost)) : Math.round(timeSec / kmCount),
      gainM: Math.round(b.gain),
    })),
    vertical,
  }
}

export function formatPace(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
