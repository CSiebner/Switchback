import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { projectToBox, smoothPath } from '../lib/geo'
import type { Trail } from '../data/seed'

const H = 60
const EASE = [0.22, 1, 0.36, 1] as const

export interface StripLine {
  trail: Trail
  held: boolean
}

export function YouStrip({ lines }: { lines: StripLine[] }) {
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

  const ordered = [...lines].sort((a, b) => Number(a.held) - Number(b.held))
  const step = ordered.length > 1 ? Math.min(52, (w - H) / (ordered.length - 1)) : 0

  return (
    <svg ref={ref} className="yo-strip" viewBox={`0 0 ${w} ${H}`} aria-hidden>
      <line x1="0" y1={H - 0.5} x2={w} y2={H - 0.5} stroke="var(--contour-light)" />
      {ordered.map(({ trail, held }, i) => {
        const pts = projectToBox(trail.path, H, H, 8).map((p) => ({ x: p.x + i * step, y: p.y }))
        return (
          <motion.path
            key={trail.id}
            d={smoothPath(pts)}
            fill="none"
            stroke={held ? 'var(--larch)' : 'var(--glacier)'}
            strokeOpacity={held ? 0.95 : 0.6}
            strokeWidth={held ? 2.4 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.08 }}
          />
        )
      })}
    </svg>
  )
}
