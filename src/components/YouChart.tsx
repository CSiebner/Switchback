import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Run, Trail } from '../data/seed'
import { formatTime } from '../lib/format'
import type { ChaseTarget } from '../store/useAppStore'

const H = 90
const TOP = 16
const BOTTOM = 22
const PAD_X = 10
const EASE = [0.22, 1, 0.36, 1] as const

export function YouChart({ trail, runs, chase }: { trail: Trail; runs: Run[]; chase: ChaseTarget }) {
  const ref = useRef<SVGSVGElement>(null)
  const [w, setW] = useState(358)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setW(el.clientWidth || 358)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const series = [...runs].sort((a, b) => a.timestamp - b.timestamp)
  const times = series.map((r) => r.timeSec)
  const all = [...times, chase.timeSec]
  const hi = Math.max(...all)
  const lo = Math.min(...all)
  const span = hi - lo || 1
  const plotH = H - TOP - BOTTOM
  const x = (i: number) => PAD_X + (series.length === 1 ? 0 : (i / (series.length - 1)) * (w - PAD_X * 2 - 36))
  const yy = (t: number) => TOP + ((hi - t) / span) * plotH

  const pts = series.map((r, i) => ({ x: x(i), y: yy(r.timeSec), t: r.timeSec }))
  const poly = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const last = pts[pts.length - 1]
  const priorBest = Math.min(...times.slice(0, -1))
  const latestIsPb = last.t < priorBest
  const chaseY = yy(chase.timeSec)

  return (
    <section className="yo-section">
      <span className="survey head">Your times on {trail.name}</span>
      <svg ref={ref} className="yo-chart" viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Run times on ${trail.name}`}>
        <line
          x1={0}
          x2={w}
          y1={chaseY}
          y2={chaseY}
          stroke="var(--larch)"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          strokeOpacity={0.9}
        />
        <text className="chase" x={0} y={Math.min(chaseY + 14, H - 2)}>
          {chase.label} {formatTime(chase.timeSec)}
        </text>
        <motion.polyline
          points={poly}
          fill="none"
          stroke="var(--glacier)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        />
        {pts.map((p, i) => {
          const isLast = i === pts.length - 1
          const gold = isLast && latestIsPb
          return (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 5 : 3.5}
              fill={gold ? 'var(--larch)' : 'var(--glacier)'}
              stroke="var(--rock-flour)"
              strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
            />
          )
        })}
        {pts.map((p, i) =>
          i === 0 || i === pts.length - 1 ? (
            <text key={`t${i}`} x={p.x} y={p.y - 9} textAnchor={i === 0 ? 'start' : 'middle'}>
              {formatTime(p.t)}
            </text>
          ) : null,
        )}
      </svg>
      <p className="survey num" style={{ marginTop: 8 }}>
        {series.length} hikes · lower is faster{latestIsPb ? ' · latest hike is a personal best' : ''}
      </p>
    </section>
  )
}
