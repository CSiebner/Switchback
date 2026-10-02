import { useEffect } from 'react'

/** Day/Dusk: Record and Result run in dusk with the nav hidden. */
export function useDusk(active: boolean) {
  useEffect(() => {
    if (!active) return
    document.body.classList.add('dusk')
    return () => document.body.classList.remove('dusk')
  }, [active])
}
