import type { Trail } from '../data/seed'
import { difficultyColor } from '../lib/format'

export function RouteSketch({ trail, height = 80 }: { trail: Trail; height?: number }) {
  const w = 160
  const h = height
  const maxE = Math.max(...trail.elevation, 1)
  const pts = trail.elevation.map((e, i) => {
    const x = 8 + (i / Math.max(trail.elevation.length - 1, 1)) * (w - 16)
    const y = h - 10 - (e / maxE) * (h - 22)
    return `${x},${y}`
  })
  const color = difficultyColor(trail.difficulty)

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <rect x="0" y="0" width={w} height={h} rx="12" fill="rgba(10,138,130,0.06)" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3.5" fill={color} />
    </svg>
  )
}
