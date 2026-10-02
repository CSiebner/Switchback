export type LngLat = [number, number]

const R = 6371000

export function haversine(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const la1 = toRad(a[1])
  const la2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function cumulativeDistances(coords: LngLat[]): number[] {
  const out = [0]
  for (let i = 1; i < coords.length; i++) {
    out.push(out[i - 1] + haversine(coords[i - 1], coords[i]))
  }
  return out
}

/** Position along the route at fraction t in [0,1], by distance */
export function pointAlong(coords: LngLat[], cum: number[], t: number): LngLat {
  if (coords.length === 0) return [0, 0]
  if (coords.length === 1) return coords[0]
  const total = cum[cum.length - 1]
  const target = Math.max(0, Math.min(1, t)) * total
  let i = 1
  while (i < cum.length && cum[i] < target) i++
  if (i >= cum.length) return coords[coords.length - 1]
  const seg = cum[i] - cum[i - 1] || 1
  const f = (target - cum[i - 1]) / seg
  return [
    coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * f,
    coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * f,
  ]
}

/** Sub-path from fraction a to b by distance */
export function slicePath(coords: LngLat[], cum: number[], a: number, b: number): LngLat[] {
  if (coords.length < 2) return coords
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const total = cum[cum.length - 1]
  const start = pointAlong(coords, cum, lo)
  const end = pointAlong(coords, cum, hi)
  const out: LngLat[] = [start]
  for (let i = 0; i < coords.length; i++) {
    const t = cum[i] / total
    if (t > lo && t < hi) out.push(coords[i])
  }
  out.push(end)
  return out
}

export function bearingBetween(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const la1 = toRad(a[1])
  const la2 = toRad(b[1])
  const dLng = toRad(b[0] - a[0])
  const y = Math.sin(dLng) * Math.cos(la2)
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function bounds(coords: LngLat[]): [LngLat, LngLat] {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of coords) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return [
    [minX, minY],
    [maxX, maxY],
  ]
}

/** Project lng/lat polyline to a normalized SVG viewbox, preserving aspect */
export function projectToBox(
  coords: LngLat[],
  w: number,
  h: number,
  pad = 6,
): { x: number; y: number }[] {
  if (!coords.length) return []
  const [[minX, minY], [maxX, maxY]] = bounds(coords)
  const midLat = (minY + maxY) / 2
  const kx = Math.cos((midLat * Math.PI) / 180)
  const spanX = (maxX - minX) * kx || 1e-6
  const spanY = maxY - minY || 1e-6
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY)
  const offX = (w - spanX * scale) / 2
  const offY = (h - spanY * scale) / 2
  return coords.map(([x, y]) => ({
    x: offX + (x - minX) * kx * scale,
    y: h - (offY + (y - minY) * scale),
  }))
}

export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}
