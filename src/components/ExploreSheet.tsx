import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion'

export type Snap = 'peek' | 'half'

interface Props {
  snap: Snap
  onSnap: (s: Snap) => void
  peek: ReactNode
  list: ReactNode
}

const PEEK_H = 268
const SPRING = { type: 'spring', stiffness: 320, damping: 32 } as const

export function ExploreSheet({ snap, onSnap, peek, list }: Props) {
  const [vh, setVh] = useState(() => window.innerHeight)
  useEffect(() => {
    const on = () => setVh(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const halfH = Math.max(vh * 0.62, PEEK_H + 140)
  const peekY = halfH - PEEK_H
  const y = useMotionValue(peekY)
  const controls = useDragControls()
  const dragged = useRef(false)
  const peekOpacity = useTransform(y, [peekY, peekY * 0.55], [1, 0])

  useEffect(() => {
    const controlsAnim = animate(y, snap === 'half' ? 0 : peekY, SPRING)
    return () => controlsAnim.stop()
  }, [snap, peekY, y])

  const grab = (e: React.PointerEvent) => controls.start(e)

  return (
    <motion.section
      className="sheet ex-sheet"
      data-snap={snap}
      style={{ y, height: halfH }}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: peekY }}
      dragElastic={0.06}
      dragMomentum={false}
      onDragStart={() => {
        dragged.current = true
      }}
      onDragEnd={(_, info) => {
        const cur = y.get()
        const next: Snap =
          info.velocity.y < -350 ? 'half' : info.velocity.y > 350 ? 'peek' : cur < peekY / 2 ? 'half' : 'peek'
        animate(y, next === 'half' ? 0 : peekY, SPRING)
        onSnap(next)
        setTimeout(() => {
          dragged.current = false
        }, 0)
      }}
    >
      <div
        className="ex-grab"
        onPointerDown={grab}
        onClick={() => {
          if (!dragged.current) onSnap(snap === 'half' ? 'peek' : 'half')
        }}
        role="button"
        aria-label={snap === 'half' ? 'Collapse list' : 'Expand list'}
      >
        <div className="sheet-handle" style={{ margin: 0 }} />
      </div>
      <div className="ex-body">
        <motion.div
          className="ex-peek"
          style={{ opacity: peekOpacity, pointerEvents: snap === 'peek' ? 'auto' : 'none' }}
          aria-hidden={snap !== 'peek'}
        >
          {peek}
        </motion.div>
        <div className="ex-list" data-active={snap === 'half'} aria-hidden={snap !== 'half'}>
          {list}
        </div>
      </div>
    </motion.section>
  )
}
