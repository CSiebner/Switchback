import { useMemo, useRef, useState } from 'react'

interface Props {
  elevation: number[]
  progress?: number
  ghostProgress?: number
  interactive?: boolean
  onScrub?: (t: number, elev: number) => void
  height?: number
  dusk?: boolean
}

export function ElevationProfile({
  elevation,
  progress,
  ghostProgress,
  interactive,
  onScrub,
  height = 120,
  dusk,
}: Props) {
  const [scrub, setScrub] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const w = 360
  const h = height
  const pad = 6
  const min = Math.min(...elevation)
  const max = Math.max(...elevation)
  const span = max - min || 1

  const points = useMemo(
    () =>
      elevation.map((e, i) => ({
        x: pad + (i / Math.max(elevation.length - 1, 1)) * (w - pad * 2),
        y: h - pad - ((e - min) / span) * (h - pad * 2 - 10),
        e,
      })),
    [elevation, min, span, h],
  )

  const d = useMemo(() => {
    if (points.length < 2) return ''
    let s = `M${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      s += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`
    }
    return s
  }, [points])

  const area = `${d} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`
  const xAt = (t: number) => pad + t * (w - pad * 2)
  const elevAt = (t: number) => {
    const idx = t * (elevation.length - 1)
    const i0 = Math.floor(idx)
    const i1 = Math.min(elevation.length - 1, i0 + 1)
    const f = idx - i0
    return elevation[i0] + (elevation[i1] - elevation[i0]) * f
  }
  const yAt = (t: number) => h - pad - ((elevAt(t) - min) / span) * (h - pad * 2 - 10)

  const handlePointer = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setScrub(t)
    onScrub?.(t, elevAt(t))
  }

  const line = dusk ? '#2fd4c4' : '#0a8a82'
  const ink = dusk ? '#e4eeeb' : '#0f201e'
  const gid = dusk ? 'elevFillDusk' : 'elevFillDay'

  return (
    <svg
      ref={svgRef}
      className="elev-svg"
      viewBox={`0 0 ${w} ${h}`}
      style={{ height }}
      preserveAspectRatio="none"
      onPointerDown={(e) => {
        if (!interactive) return
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
        handlePointer(e.clientX)
      }}
      onPointerMove={(e) => interactive && scrub !== null && handlePointer(e.clientX)}
      onPointerUp={() => interactive && setScrub(null)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={line} stopOpacity={dusk ? 0.35 : 0.3} />
          <stop offset="100%" stopColor={line} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={line} strokeWidth="2.2" strokeLinecap="round" opacity={0.9} />

      {progress !== undefined && ghostProgress !== undefined && (
        <rect
          x={Math.min(xAt(progress), xAt(ghostProgress))}
          y={0}
          width={Math.abs(xAt(progress) - xAt(ghostProgress))}
          height={h}
          fill="#f5b544"
          opacity={0.16}
        />
      )}

      {ghostProgress !== undefined && (
        <g>
          <line x1={xAt(ghostProgress)} y1={0} x2={xAt(ghostProgress)} y2={h} stroke="#f5b544" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
          <circle cx={xAt(ghostProgress)} cy={yAt(ghostProgress)} r="5" fill="#f5b544" stroke={dusk ? '#0b1716' : '#fff'} strokeWidth="2" />
        </g>
      )}

      {progress !== undefined && (
        <g>
          <line x1={xAt(progress)} y1={0} x2={xAt(progress)} y2={h} stroke={ink} strokeWidth="1.2" opacity="0.4" />
          <circle cx={xAt(progress)} cy={yAt(progress)} r="5.5" fill={line} stroke="#fff" strokeWidth="2" />
        </g>
      )}

      {scrub !== null && (
        <g>
          <line x1={xAt(scrub)} y1={0} x2={xAt(scrub)} y2={h} stroke={ink} strokeWidth="1" opacity="0.5" />
          <circle cx={xAt(scrub)} cy={yAt(scrub)} r="5" fill={ink} />
          <text x={Math.min(xAt(scrub) + 8, w - 60)} y={Math.max(yAt(scrub) - 10, 14)} fontSize="12" fontWeight="700" fill={ink}>
            {Math.round(elevAt(scrub))} m
          </text>
        </g>
      )}
    </svg>
  )
}
