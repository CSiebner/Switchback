import '../styles/explore.css'
import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrailMap } from '../components/TrailMap'
import { RouteGlyph } from '../components/RouteGlyph'
import { ExploreSheet, type Snap } from '../components/ExploreSheet'
import { ExploreSelected } from '../components/ExploreSelected'
import { ExploreList } from '../components/ExploreList'
import {
  buildLines,
  FILTERS,
  matchesFilter,
  sortLines,
  type ExploreFilter,
} from '../components/ExploreModel'
import { trails } from '../data/trails'
import type { Trail } from '../data/seed'
import { useAppStore } from '../store/useAppStore'

const FIT_PADDING = { top: 150, bottom: 340, left: 40, right: 40 }

export function Explore() {
  const runs = useAppStore((s) => s.runs)
  const conditions = useAppStore((s) => s.conditions)
  const [filter, setFilter] = useState<ExploreFilter>('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [snap, setSnap] = useState<Snap>('peek')

  const all = useMemo(() => buildLines(trails, runs, conditions), [runs, conditions])
  const lines = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortLines(
      all.filter(
        (l) =>
          matchesFilter(l, filter) &&
          (!q || `${l.trail.name} ${l.trail.region}`.toLowerCase().includes(q)),
      ),
    )
  }, [all, filter, query])

  const filteredTrails = useMemo(() => lines.map((l) => l.trail), [lines])
  const routes = useMemo(() => filteredTrails.map((t) => ({ id: t.id, coords: t.path })), [filteredTrails])
  const selected = lines.find((l) => l.trail.id === selectedId) ?? lines[0]

  const byId = useMemo(() => new Map(all.map((l) => [l.trail.id, l])), [all])
  const pinClass = useCallback(
    (t: Trail) => {
      const l = byId.get(t.id)
      if (l?.holds) return 'pb'
      if (l?.pb !== undefined) return 'done'
      return ''
    },
    [byId],
  )
  const select = useCallback((id: string) => setSelectedId(id), [])
  const pick = useCallback((id: string) => {
    setSelectedId(id)
    setSnap('peek')
  }, [])
  const reset = () => {
    setFilter('All')
    setQuery('')
  }

  return (
    <div className="ex-root">
      <TrailMap
        trails={filteredTrails}
        routes={routes}
        route={selected?.trail.path}
        selectedId={selected?.trail.id}
        onSelect={select}
        mood="day"
        pitch={45}
        fit
        fitPadding={FIT_PADDING}
        pinClass={pinClass}
      />

      <div className="ex-top">
        <div className="ex-search">
          <span className="ex-search-glyph">
            {selected ? (
              <RouteGlyph key={selected.trail.id} coords={selected.trail.path} size={22} stroke="#0f201e" strokeWidth={1.8} animate={false} />
            ) : (
              <span className="ex-search-dot" />
            )}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bow Valley lines"
            aria-label="Search lines"
            enterKeyHint="search"
          />
        </div>
        <div className="ex-chips" role="tablist" aria-label="Filter lines">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`chip ${filter === f ? 'active on' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ExploreSheet
        snap={snap}
        onSnap={setSnap}
        peek={
          selected ? (
            <ExploreSelected line={selected} />
          ) : (
            <motion.div className="ex-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="survey">No lines match. Loosen the filters.</p>
              <button type="button" className="chip" onClick={reset}>
                Reset filters
              </button>
            </motion.div>
          )
        }
        list={<ExploreList lines={lines} selectedId={selected?.trail.id} active={snap === 'half'} onPick={pick} />}
      />
    </div>
  )
}
