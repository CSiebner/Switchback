import { trails as seedTrails, type Trail } from './seed'
import { trailGeometry } from './geometry'

/** Trails enriched with real geometry when available. */
export const trails: Trail[] = seedTrails.map((t) => {
  const g = trailGeometry[t.id]
  if (!g) return t
  // Geometry is one-way (trailhead → summit); keep seed round-trip stats.
  return {
    ...t,
    path: g.coords,
    elevation: g.elevation,
    center: g.coords[Math.floor(g.coords.length / 2)] ?? t.center,
  }
})

export function getTrail(id: string) {
  return trails.find((t) => t.id === id)
}
