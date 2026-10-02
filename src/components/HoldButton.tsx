import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  label: string
  holdMs?: number
  onComplete: () => void
  onTap?: () => void
  color?: string
  icon?: React.ReactNode
}

/** Hold-to-confirm. Works with gloves; no accidental taps. */
export function HoldButton({ label, holdMs = 900, onComplete, onTap, color = '#f5b544', icon }: Props) {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)
  const start = useRef<number | null>(null)
  const done = useRef(false)

  const stop = (fire: boolean) => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = null
    const wasHolding = start.current !== null
    start.current = null
    if (!fire && wasHolding && !done.current && progress < 0.15) onTap?.()
    done.current = false
    setProgress(0)
  }

  const tick = (ts: number) => {
    if (start.current === null) return
    const p = Math.min(1, (ts - start.current) / holdMs)
    setProgress(p)
    if (p >= 1) {
      done.current = true
      onComplete()
      stop(true)
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => stop(true), [])

  const r = 44
  const c = 2 * Math.PI * r

  return (
    <button
      className="hold-btn"
      onPointerDown={(e) => {
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
        start.current = performance.now()
        raf.current = requestAnimationFrame(tick)
      }}
      onPointerUp={() => stop(false)}
      onPointerCancel={() => stop(true)}
      onPointerLeave={() => stop(true)}
      aria-label={label}
    >
      <svg className="ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(228,238,235,0.15)" strokeWidth="3" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - progress) }}
          transition={{ duration: 0 }}
        />
      </svg>
      {icon ?? <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.04em' }}>{label}</span>}
    </button>
  )
}
