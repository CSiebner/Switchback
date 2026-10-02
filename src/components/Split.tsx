import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  seconds: number // negative = ahead
  slam?: boolean
  size?: 'hud' | 'result'
  neutral?: boolean
}

function fmt(sec: number) {
  const s = Math.abs(Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  return `${m}:${String(r).padStart(2, '0')}`
}

/** The one number per screen. Hollow teal when behind, solid larch when ahead. */
export function Split({ seconds, slam, size = 'hud', neutral }: Props) {
  const spring = useSpring(slam ? 0 : seconds, { stiffness: 90, damping: 18 })
  const display = useTransform(spring, (v) => fmt(v))

  useEffect(() => {
    spring.set(seconds)
  }, [seconds, spring])

  const ahead = seconds <= 0
  const sign = ahead ? '−' : '+'
  const cls = neutral ? 'neutral' : ahead ? 'ahead' : 'behind'

  return (
    <motion.div
      className={`split ${cls}`}
      style={{ fontSize: size === 'result' ? 'var(--type-split)' : 'clamp(3.6rem, 18vw, 5.4rem)' }}
      initial={slam ? { scale: 0.86, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18, delay: slam ? 0.1 : 0 }}
    >
      <span style={{ opacity: 0.85 }}>{neutral ? '' : sign}</span>
      <motion.span>{display}</motion.span>
    </motion.div>
  )
}

export function formatSplit(sec: number) {
  return `${sec <= 0 ? '−' : '+'}${fmt(sec)}`
}
