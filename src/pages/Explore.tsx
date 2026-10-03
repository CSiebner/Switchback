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

const FIT_PADDING = { top: 100, bottom: 460, left: 28, right: 28 }

const FILTER_LABEL: Record<ExploreFilter, string> = {
  All: 'All',
  Easy: 'Easy',
  Moderate: 'Moderate',
  Hard: 'Hard',
  Chaseable: 'Someone ahead',
  'Fresh dirt': 'Recent conditions',
}

export function Explore() {
  const runs = useAppStore((s) => s.runs)
  const conditions = useAppStore((s) => s.conditions)
  const [filter, setFilter] = useState<ExploreFilter>('All')
  const [region, setRegion] = useState('All areas')
  const [climb, setClimb] = useState<'Any climb' | 'Under 400 m' | '400–700 m' | 'Over 700 m'>('Any climb')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [focused, setFocused] = useState(false)
  const [snap, setSnap] = useState<Snap>('peek')
  const [showFilters, setShowFilters] = useState(false)

  const all = useMemo(() => buildLines(trails, runs, conditions), [runs, conditions])
  const lines = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortLines(
      all.filter((l) => {
        if (!matchesFilter(l, filter)) return false
        if (region !== 'All areas' && l.trail.region !== region) return false
        const gain = l.trail.gainM
        if (climb === 'Under 400 m' && gain >= 400) return false
        if (climb === '400–700 m' && (gain < 400 || gain > 700)) return false
        if (climb === 'Over 700 m' && gain <= 700) return false
        return !q || `${l.trail.name} ${l.trail.region}`.toLowerCase().includes(q)
      }),
    )
  }, [all, filter, query, region, climb])

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
  const select = useCallback((id: string) => {
    setSelectedId(id)
    setFocused(true)
  }, [])
  const pick = useCallback((id: string) => {
    setSelectedId(id)
    setFocused(true)
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
        route={focused ? selected?.trail.path : undefined}
        selectedId={selected?.trail.id}
        onSelect={select}
        mood="day"
        pitch={45}
        fit
        fitAll={!focused}
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
            placeholder="Search trails"
            aria-label="Search trails"
            enterKeyHint="search"
          />
        </div>
        <div className="ex-chips">
          <button type="button" className={`chip ${showFilters ? 'active on' : ''}`} onClick={() => setShowFilters((v) => !v)}>
            Filter
          </button>
        </div>
        {showFilters && <>
        <div className="ex-chips" role="tablist" aria-label="Filter trails">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`chip ${filter === f ? 'active on' : ''}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="ex-chips" aria-label="Area and climb">
          {['All areas', ...new Set(trails.map((t) => t.region))].map((r) => (
            <button key={r} type="button" className={`chip ${region === r ? 'active on' : ''}`} onClick={() => setRegion(r)}>{r}</button>
          ))}
          {(['Any climb', 'Under 400 m', '400–700 m', 'Over 700 m'] as const).map((c) => (
            <button key={c} type="button" className={`chip ${climb === c ? 'active on' : ''}`} onClick={() => setClimb(c)}>{c}</button>
          ))}
        </div>
        </>}
      </div>

      <ExploreSheet
        snap={snap}
        onSnap={setSnap}
        peek={
          selected ? (
            <ExploreSelected line={selected} />
          ) : (
            <motion.div className="ex-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="survey">No trails match. Loosen the filters.</p>
              <button type="button" className="chip" onClick={reset}>
                Reset filters
              </button>
            </motion.div>
          )
        }
        listKey={`${filter}|${region}|${climb}|${query}|${lines.map((l) => l.trail.id).join(',')}`}
        list={<ExploreList lines={lines} selectedId={selected?.trail.id} active={snap === 'open'} onPick={pick} />}
      />
    </div>
  )
}
