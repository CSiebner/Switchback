import { effortFor, formatPace } from '../lib/effort'
import { getTrail } from '../data/trails'
import { getHiker } from '../data/seed'
import { useAppStore } from '../store/useAppStore'
import { RouteGlyph } from './RouteGlyph'

/** Pace records and the crew plan. The page's big time stays above this. */
export function TrailStory({ trailId }: { trailId: string }) {
  const trail = getTrail(trailId)
  const runs = useAppStore((s) => s.runs)
  const packed = useAppStore((s) => s.packedTrailIds)
  const pack = useAppStore((s) => s.packTrail)
  const crews = useAppStore((s) => s.crews)
  const joined = useAppStore((s) => s.joinedCrewIds)
  if (!trail) return null

  const mine = runs.filter((r) => r.userId === 'you' && r.trailId === trailId)
  const efforts = mine.map((r) => ({ r, e: effortFor(trail, r.movingSec ?? r.timeSec) }))
  const ascent = efforts.filter((x) => x.e.ascentPaceSec).sort((a, b) => a.e.ascentPaceSec! - b.e.ascentPaceSec!)[0]
  const descent = efforts.filter((x) => x.e.descentPaceSec).sort((a, b) => a.e.descentPaceSec! - b.e.descentPaceSec!)[0]
  const dry = mine.some((r) => r.conditions.includes('Dry'))
  const outing = crews.find((c) => joined.includes(c.id) && c.outing?.trailId === trailId)?.outing
  const facts = [
    ascent?.e.ascentPaceSec ? { v: formatPace(ascent.e.ascentPaceSec), l: 'per 100 m up' } : null,
    descent?.e.descentPaceSec ? { v: formatPace(descent.e.descentPaceSec), l: 'per 100 m down' } : null,
  ].filter(Boolean) as { v: string; l: string }[]

  return (
    <section style={{ marginTop: 36 }}>
      <p className="survey">On your record</p>
      {mine.length === 0 && <p style={{ marginTop: 10 }}>No ascents yet. The first one starts the record.</p>}
      {dry && mine.length > 0 && <p style={{ marginTop: 10, fontWeight: 700 }}>Your best was set on a dry day.</p>}
      {facts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${facts.length}, 1fr)`, gap: 20, marginTop: 16 }}>
          {facts.map((f) => (
            <div key={f.l}>
              <p className="num" style={{ fontWeight: 800, fontSize: 'var(--type-lg)' }}>{f.v}</p>
              <p className="survey" style={{ marginTop: 4 }}>{f.l}</p>
            </div>
          ))}
        </div>
      )}
      {outing && (
        <div className="hairline" style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', marginTop: 22, paddingTop: 16 }}>
          <RouteGlyph coords={trail.path} size={44} stroke="#0f201e" strokeWidth={2} />
          <div>
            <p style={{ fontWeight: 800 }}>{outing.when}</p>
            <p className="survey" style={{ marginTop: 4 }}>{outing.pace ?? 'steady'} · {outing.meet}</p>
            <p className="survey">
              {getHiker(outing.driver ?? '')?.name ?? 'Someone'} driving
              {outing.seats !== undefined ? ` · ${outing.seats} seats` : ''}
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => pack(trailId)}
        disabled={packed.includes(trailId)}
        className="survey"
        style={{ marginTop: 18, background: 'none', border: 'none', padding: 0, cursor: packed.includes(trailId) ? 'default' : 'pointer', color: 'var(--glacier-deep)' }}
      >
        {packed.includes(trailId) ? 'Saved on this phone' : 'Save this trail on my phone'}
      </button>
      <p className="survey" style={{ marginTop: 6 }}>The route stays available with no signal. The map picture still needs a connection.</p>
    </section>
  )
}
