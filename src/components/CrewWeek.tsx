import { useMemo } from 'react'
import { TrailMap } from './TrailMap'
import { getTrail } from '../data/trails'
import type { Crew } from '../data/seed'
import { useAppStore } from '../store/useAppStore'

/** Where this crew actually went in the last week. */
export function CrewWeek({ crew }: { crew: Crew }) {
  const runs = useAppStore((s) => s.runs)
  const routes = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000
    const ids = new Set(
      runs.filter((r) => crew.members.includes(r.userId) && r.timestamp >= since).map((r) => r.trailId),
    )
    return [...ids]
      .map((id) => getTrail(id))
      .filter((t) => t)
      .map((t) => ({ id: t!.id, coords: t!.path }))
  }, [runs, crew.members])

  if (routes.length === 0) return null
  return (
    <section className="cr-section">
      <span className="survey head">This week on the dirt</span>
      <div style={{ position: 'relative', height: 220, marginTop: 12, borderRadius: 16, overflow: 'hidden' }}>
        <TrailMap trails={[]} routes={routes} mood="day" pitch={40} interactive fit fitPadding={{ top: 24, bottom: 24, left: 24, right: 24 }} />
      </div>
      <p className="survey" style={{ marginTop: 8 }}>{routes.length} lines · crew only, nothing live</p>
    </section>
  )
}
