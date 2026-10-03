import { motion } from 'framer-motion'
import { RouteGlyph } from './RouteGlyph'
import { rowSurvey, type Line } from './ExploreModel'

interface Props {
  lines: Line[]
  selectedId?: string
  active: boolean
  onPick: (id: string) => void
}

const rowVariants = {
  out: { opacity: 0, y: 10, transition: { duration: 0.12 } },
  in: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: 0.12 + i * 0.04 },
  }),
}

export function ExploreList({ lines, selectedId, active, onPick }: Props) {
  return (
    <>
      <p className="survey ex-list-head">
        {lines.length} {lines.length === 1 ? 'trail' : 'trails'}
      </p>
      <div className="ex-rows">
        {lines.map((l, i) => {
          const sel = l.trail.id === selectedId
          return (
            <motion.button
              key={l.trail.id}
              type="button"
              className={`hairline ex-row ${sel ? 'sel' : ''}`}
              variants={rowVariants}
              custom={i}
              initial="out"
              animate={active ? 'in' : 'out'}
              tabIndex={active ? 0 : -1}
              onClick={() => onPick(l.trail.id)}
            >
              <RouteGlyph
                coords={l.trail.path}
                size={48}
                stroke={l.holds ? '#d97706' : '#0f201e'}
                strokeWidth={2}
                animate={false}
              />
              <span className="ex-row-text">
                <span className="ex-row-name">{l.trail.name}</span>
                <span className="survey num">{rowSurvey(l)}</span>
              </span>
              <span className={`ex-rank num ${l.holds ? 'gold' : ''}`}>{l.rank > 0 ? `#${l.rank}` : '—'}</span>
            </motion.button>
          )
        })}
      </div>
    </>
  )
}
