import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

export type Snap = 'peek' | 'open'

interface Props {
  snap: Snap
  onSnap: (s: Snap) => void
  peek: ReactNode
  list: ReactNode
  /** Changes when the filtered hikes change, so the list returns to the top. */
  listKey: string
}

const DRAG = 28

/**
 * Collapsed: the selected hike only, sitting above the dock.
 * Expanded: that same card, plus the other hikes that match the filters.
 * Drag the handle or the card (not the action buttons). Tap the handle to toggle.
 */
export function ExploreSheet({ snap, onSnap, peek, list, listKey }: Props) {
  const sheetRef = useRef<HTMLElement>(null)
  const grabRef = useRef<HTMLDivElement>(null)
  const peekRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ y: number; pointerId: number; fromHandle: boolean; moved: boolean } | null>(null)
  const handledAt = useRef(0)
  const collapsedRef = useRef(0)
  const expandedRef = useRef(0)

  useLayoutEffect(() => {
    const sheet = sheetRef.current
    const grab = grabRef.current
    const peekEl = peekRef.current
    if (!sheet || !grab || !peekEl) return

    const apply = () => {
      if (dragRef.current?.moved) return
      const collapsed = grab.offsetHeight + peekEl.offsetHeight
      const root = sheet.parentElement
      const rootH = root?.clientHeight ?? window.innerHeight
      const bottom = parseFloat(getComputedStyle(sheet).bottom) || 0
      const topH = root?.querySelector('.ex-top')?.getBoundingClientRect().height ?? 0
      const room = rootH - bottom - topH - 10
      // Cap the open sheet so the filtered list still has somewhere to scroll,
      // and never let it climb over the search or down onto the dock.
      const expanded = Math.max(collapsed, Math.min(room, collapsed + 420))
      collapsedRef.current = collapsed
      expandedRef.current = expanded
      const target = snap === 'open' ? expanded : collapsed
      sheet.style.height = `${Math.round(target)}px`
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(peekEl)
    const top = sheet.parentElement?.querySelector('.ex-top')
    if (top) ro.observe(top)
    window.addEventListener('resize', apply)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [snap])

  useLayoutEffect(() => {
    if (snap !== 'open') return
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [snap, listKey])

  const toggle = () => onSnap(snap === 'open' ? 'peek' : 'open')

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    const fromHandle = !!target.closest('.ex-grab')
    if (!fromHandle && target.closest('a, button, input, textarea, select, .ex-scroll')) return
    dragRef.current = { y: e.clientY, pointerId: e.pointerId, fromHandle, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dy = e.clientY - drag.y
    if (Math.abs(dy) < 6) return
    drag.moved = true
    const sheet = sheetRef.current
    if (!sheet) return
    sheet.classList.add('is-dragging')
    const base = snap === 'open' ? expandedRef.current : collapsedRef.current
    const next = Math.max(collapsedRef.current, Math.min(expandedRef.current, base - dy))
    sheet.style.height = `${Math.round(next)}px`
  }

  const finish = (clientY: number, pointerId: number) => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.pointerId !== pointerId) return
    const sheet = sheetRef.current
    const dy = clientY - drag.y
    sheet?.classList.remove('is-dragging')
    if (drag.fromHandle) handledAt.current = performance.now()
    // A short pull on the handle is a tap. A longer drag snaps open or closed.
    if (drag.fromHandle && Math.abs(dy) < DRAG) {
      toggle()
      return
    }
    const next: Snap = dy <= -DRAG ? 'open' : dy >= DRAG ? 'peek' : snap
    const target = next === 'open' ? expandedRef.current : collapsedRef.current
    if (sheet) {
      void sheet.offsetHeight
      sheet.style.height = `${Math.round(target)}px`
    }
    if (next !== snap) onSnap(next)
  }

  return (
    <section
      ref={sheetRef}
      className="sheet ex-sheet"
      data-snap={snap}
      aria-label="Selected hike"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e.clientY, e.pointerId)}
      onPointerCancel={(e) => finish(e.clientY, e.pointerId)}
    >
      <div
        ref={grabRef}
        className="ex-grab"
        role="button"
        tabIndex={0}
        aria-expanded={snap === 'open'}
        aria-controls="explore-hike-list"
        aria-label={snap === 'open' ? 'Collapse the hike list' : 'Show the other hikes'}
        onClick={() => {
          if (performance.now() - handledAt.current < 500) return
          toggle()
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          toggle()
        }}
      >
        <div className="sheet-handle" />
      </div>
      <div ref={peekRef} className="ex-peek">
        {peek}
      </div>
      <div
        ref={scrollRef}
        id="explore-hike-list"
        className="ex-scroll"
        aria-hidden={snap !== 'open'}
      >
        {list}
      </div>
    </section>
  )
}
