import { useMemo, useRef, useState } from 'react'

interface Props {
  elevation: number[]
  progress?: number // 0-1 you
  ghostProgress?: number // 0-1 ghost
  interactive?: boolean
  onScrub?: (index: number, elev: number, t: number) => void
  height?: number
}

export function ElevationProfile({
  elevation,
  progress,
  ghostProgress,
  interactive,
  onScrub,
  height = 120,
}: Props) {
  const [scrub, setScrub] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const w = 320
  const h = height
  const pad = 8
  const max = Math.max(...elevation, 1)

  const points = useMemo(() => {
    return elevation.map((e, i) => {
      const x = pad + (i / Math.max(elevation.length - 1, 1)) * (w - pad * 2)
      const y = h - pad - (e / max) * (h - pad * 2)
      return { x, y, e }
    })
  }, [elevation, max, h])

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${d} L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`

  function handlePointer(clientX: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * w
    let best = 0
    let bestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setScrub(best)
    onScrub?.(best, elevation[best], best / Math.max(elevation.length - 1, 1))
  }

  const scrubPt = scrub !== null ? points[scrub] : null
  const youX =
    progress !== undefined
      ? pad + progress * (w - pad * 2)
      : null
  const ghostX =
    ghostProgress !== undefined
      ? pad + ghostProgress * (w - pad * 2)
      : null

  return (
    <svg
      ref={svgRef}
      className="elev-svg"
      viewBox={`0 0 ${w} ${h}`}
      style={{ height }}
      onPointerDown={(e) => {
        if (!interactive) return
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
        handlePointer(e.clientX)
      }}
      onPointerMove={(e) => {
        if (!interactive || scrub === null) return
        handlePointer(e.clientX)
      }}
      onPointerUp={() => interactive && setScrub(null)}
    >
      <defs>
        <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a8a82" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0a8a82" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#elevFill)" />
      <path d={d} fill="none" stroke="#0a8a82" strokeWidth="2.5" strokeLinecap="round" />

      {ghostX !== null && (
        <g className="ghost-dot">
          <line x1={ghostX} y1={pad} x2={ghostX} y2={h - pad} stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
          <circle cx={ghostX} cy={pad + 10} r="5" fill="#fbbf24" stroke="white" strokeWidth="2" />
        </g>
      )}

      {youX !== null && (
        <g>
          <line x1={youX} y1={pad} x2={youX} y2={h - pad} stroke="#10201e" strokeWidth="1.5" opacity="0.35" />
          <circle cx={youX} cy={pad + 10} r="5" fill="#0a8a82" stroke="white" strokeWidth="2" />
        </g>
      )}

      {scrubPt && (
        <g>
          <line x1={scrubPt.x} y1={pad} x2={scrubPt.x} y2={h - pad} stroke="#10201e" strokeWidth="1" opacity="0.4" />
          <circle cx={scrubPt.x} cy={scrubPt.y} r="5" fill="#10201e" />
          <text x={Math.min(scrubPt.x + 6, w - 50)} y={Math.max(scrubPt.y - 8, 16)} fontSize="11" fontWeight="700" fill="#10201e">
            {Math.round(scrubPt.e)} m
          </text>
        </g>
      )}
    </svg>
  )
}
