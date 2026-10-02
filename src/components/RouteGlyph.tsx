import { motion } from 'framer-motion'
import type { LngLat } from '../lib/geo'
import { projectToBox, smoothPath } from '../lib/geo'

interface Props {
  coords: LngLat[]
  size?: number
  stroke?: string
  casing?: string
  strokeWidth?: number
  animate?: boolean
  dotted?: boolean
  className?: string
}

/** Plan-view route mark: the Switchback "line". */
export function RouteGlyph({
  coords,
  size = 72,
  stroke = 'currentColor',
  casing,
  strokeWidth = 2.2,
  animate = true,
  dotted,
  className,
}: Props) {
  const pts = projectToBox(coords, size, size, 8)
  const d = smoothPath(pts)
  const end = pts[pts.length - 1]
  const start = pts[0]

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden
    >
      {casing && (
        <path d={d} stroke={casing} strokeWidth={strokeWidth + 3} strokeLinecap="round" strokeLinejoin="round" />
      )}
      <motion.path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dotted ? '2 4' : undefined}
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
      />
      {start && <circle cx={start.x} cy={start.y} r={strokeWidth} fill={stroke} opacity={0.6} />}
      {end && (
        <g>
          <circle cx={end.x} cy={end.y} r={strokeWidth + 1.5} fill={stroke} />
          <line
            x1={end.x + 4}
            y1={end.y}
            x2={end.x + 10}
            y2={end.y}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  )
}
