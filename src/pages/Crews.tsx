import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getHiker, getTrail } from '../data/seed'
import { relativeTime } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

export function Crews() {
  const crews = useAppStore((s) => s.crews)
  const joinedCrewIds = useAppStore((s) => s.joinedCrewIds)
  const feed = useAppStore((s) => s.feed)
  const joinCrew = useAppStore((s) => s.joinCrew)
  const toggleKudo = useAppStore((s) => s.toggleKudo)

  return (
    <div className="page page-pad">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p
          className="display"
          style={{ fontSize: 'clamp(2.4rem, 10vw, 3rem)', fontWeight: 800, lineHeight: 0.95, marginTop: 8 }}
        >
          Crews
        </p>
        <p className="muted" style={{ marginTop: 10, maxWidth: 360, lineHeight: 1.45 }}>
          Local hiking groups — not a global feed. Your recorded hikes fuel challenges, outings, and kudos.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gap: 14, marginTop: 22 }}>
        {crews.map((crew, i) => {
          const joined = joinedCrewIds.includes(crew.id)
          const outingTrail = crew.outing ? getTrail(crew.outing.trailId) : undefined
          const pct = Math.min(100, (crew.challengeProgress / crew.challengeGoal) * 100)
          return (
            <motion.section
              key={crew.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                padding: 16,
                borderRadius: 22,
                background: 'rgba(255,255,255,0.78)',
                border: '1px solid var(--line)',
                boxShadow: '0 8px 28px rgba(16,32,30,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                <div>
                  <h2 className="display" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    {crew.name}
                  </h2>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {crew.region} · {crew.members.length} hikers
                  </p>
                </div>
                {!joined ? (
                  <button className="btn btn-primary" style={{ padding: '10px 14px' }} onClick={() => joinCrew(crew.id)}>
                    Join
                  </button>
                ) : (
                  <span className="chip active" style={{ cursor: 'default' }}>Joined</span>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                  <span>{crew.challenge}</span>
                  <span className="muted">
                    {crew.challengeProgress.toLocaleString()} / {crew.challengeGoal.toLocaleString()} {crew.challengeUnit}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    height: 8,
                    borderRadius: 999,
                    background: 'rgba(16,32,30,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #0a8a82, #4fd1c5)',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>

              {crew.outing && outingTrail && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(10,138,130,0.1), rgba(217,119,6,0.1))',
                    border: '1px solid var(--line)',
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                    Partner beacon
                  </p>
                  <p style={{ fontWeight: 800, marginTop: 4 }}>
                    {outingTrail.name} · {crew.outing.when}
                  </p>
                  <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Going: {crew.outing.going.map((id) => (id === 'you' ? 'You' : getHiker(id)?.name)).join(', ')}
                  </p>
                  <Link to={`/trail/${outingTrail.id}`} style={{ display: 'inline-block', marginTop: 8, fontWeight: 700, color: 'var(--teal)', fontSize: 13 }}>
                    View trail →
                  </Link>
                </div>
              )}
            </motion.section>
          )
        })}
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Local feed</h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 2, marginBottom: 12 }}>
          PBs, conditions, and outings from people on the same dirt.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {feed.map((item) => {
            const user = getHiker(item.userId)
            const trail = item.trailId ? getTrail(item.trailId) : undefined
            const loved = item.kudos.includes('you')
            return (
              <article
                key={item.id}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontWeight: 800 }}>
                    {user?.name ?? 'Hiker'}
                    {item.type === 'pb' && (
                      <span style={{ marginLeft: 8, color: 'var(--gold)', fontSize: 12 }}>NEW PB</span>
                    )}
                    {item.type === 'outing' && (
                      <span style={{ marginLeft: 8, color: 'var(--teal)', fontSize: 12 }}>OUTING</span>
                    )}
                  </p>
                  <span className="muted" style={{ fontSize: 12 }}>{relativeTime(item.timestamp)}</span>
                </div>
                <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.45 }}>{item.text}</p>
                {trail && (
                  <Link to={`/trail/${trail.id}`} className="muted" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700 }}>
                    {trail.name}
                  </Link>
                )}
                <div style={{ marginTop: 10 }}>
                  <button className={`kudo ${loved ? 'loved' : ''}`} onClick={() => toggleKudo(item.id)}>
                    ▲ Kudos · {item.kudos.length}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
