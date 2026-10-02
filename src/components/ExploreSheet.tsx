import { useRef, type ReactNode } from 'react'

export type Snap = 'peek' | 'half'

interface Props {
  snap: Snap
  onSnap: (s: Snap) => void
  peek: ReactNode
  list: ReactNode
}

/** The card sits above the tab bar. Drag the handle up to scroll the filtered list. */
export function ExploreSheet({ snap, onSnap, peek, list }: Props) {
  const startY = useRef<number | null>(null)

  const finish = (clientY: number) => {
    const from = startY.current
    startY.current = null
    if (from === null) return
    const dy = clientY - from
    if (dy < -28) onSnap('half')
    else if (dy > 28) onSnap('peek')
    else onSnap(snap === 'half' ? 'peek' : 'half')
  }

  return (
    <section className="sheet ex-sheet" data-snap={snap}>
      <div
        className="ex-grab"
        onPointerDown={(e) => {
          startY.current = e.clientY
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => finish(e.clientY)}
        onPointerCancel={() => {
          startY.current = null
        }}
        role="button"
        aria-label={snap === 'half' ? 'Collapse the list' : 'Show the filtered hikes'}
      >
        <div className="sheet-handle" style={{ margin: 0 }} />
      </div>
      <div className="ex-body">
        <div className="ex-peek" aria-hidden={snap !== 'peek'}>
          {peek}
        </div>
        <div className="ex-list" data-active={snap === 'half'} aria-hidden={snap !== 'half'}>
          {list}
        </div>
      </div>
    </section>
  )
}
