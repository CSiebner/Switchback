import { effortFor, formatPace } from '../lib/effort'
import { formatTime } from '../lib/format'
import { getTrail } from '../data/trails'
import { getHiker } from '../data/seed'
import { useAppStore } from '../store/useAppStore'

/** Your history on one line: bests by effort, and the option to pack it. */
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
  const dry = mine.filter((r) => r.conditions.includes('Dry')).sort((a, b) => a.timeSec - b.timeSec)[0]
  const any = mine.slice().sort((a, b) => a.timeSec - b.timeSec)[0]
  const outing = crews.find((c) => joined.includes(c.id) && c.outing?.trailId === trailId)?.outing

  return (
    <section style={{ marginTop: 22 }}>
      <p className="survey">Your history on this line</p>
      {mine.length === 0 && <p style={{ marginTop: 8 }}>No ascents yet. The first one starts the record.</p>}
      {any && (
        <p className="num" style={{ marginTop: 8, fontWeight: 700 }}>
          Best {formatTime(any.timeSec)}
          {dry && dry.id !== any.id ? ` · dry days ${formatTime(dry.timeSec)}` : dry ? ' · set on a dry day' : ''}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="hairline" style={{ paddingTop: 8 }}>
          <p className="num" style={{ fontWeight: 800 }}>{ascent?.e.ascentPaceSec ? formatPace(ascent.e.ascentPaceSec) : '—'}</p>
          <p className="survey">best per 100 m up</p>
        </div>
        <div className="hairline" style={{ paddingTop: 8 }}>
          <p className="num" style={{ fontWeight: 800 }}>{descent?.e.descentPaceSec ? formatPace(descent.e.descentPaceSec) : '—'}</p>
          <p className="survey">best per 100 m down</p>
        </div>
      </div>
      {outing && (
        <p className="survey num" style={{ marginTop: 12 }}>
          Crew · {outing.when} · {outing.pace} · {outing.meet} · {getHiker(outing.driver ?? '')?.name} driving
        </p>
      )}
      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => pack(trailId)} disabled={packed.includes(trailId)}>
        {packed.includes(trailId) ? 'Saved on this phone' : 'Save this trail on my phone'}
      </button>
      <p className="survey" style={{ marginTop: 6 }}>The route stays available with no signal. The map picture still needs a connection. Your location is never shared.</p>
    </section>
  )
}
