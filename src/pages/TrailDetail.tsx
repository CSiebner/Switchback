import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ElevationProfile } from '../components/ElevationProfile'
import { TrailMap } from '../components/TrailMap'
import { CURRENT_USER_ID, getHiker, getTrail, hikers } from '../data/seed'
import {
  conditionConfidence,
  formatGain,
  formatKm,
  formatTime,
  relativeTime,
} from '../lib/format'
import { bestTime, leaderboard, useAppStore } from '../store/useAppStore'

type RankTab = 'everyone' | 'age' | 'improved' | 'level'
type DetailTab = 'performance' | 'conditions' | 'reviews'

export function TrailDetail() {
  const { id = '' } = useParams()
  const trail = getTrail(id)
  const navigate = useNavigate()
  const runs = useAppStore((s) => s.runs)
  const reviews = useAppStore((s) => s.reviews)
  const conditions = useAppStore((s) => s.conditions)
  const chase = useAppStore((s) => s.chase)
  const setChase = useAppStore((s) => s.setChase)
  const savedTrailIds = useAppStore((s) => s.savedTrailIds)
  const toggleSaveTrail = useAppStore((s) => s.toggleSaveTrail)
  const confirmCondition = useAppStore((s) => s.confirmCondition)
  const addCondition = useAppStore((s) => s.addCondition)
  const addReview = useAppStore((s) => s.addReview)
  const ageBracket = useAppStore((s) => s.ageBracket)
  const experience = useAppStore((s) => s.experience)

  const [rankTab, setRankTab] = useState<RankTab>('everyone')
  const [detailTab, setDetailTab] = useState<DetailTab>('performance')
  const [condTags, setCondTags] = useState<string[]>(['Dry'])
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(5)

  const pb = bestTime(runs, CURRENT_USER_ID, id)
  const history = runs
    .filter((r) => r.userId === CURRENT_USER_ID && r.trailId === id)
    .sort((a, b) => b.timestamp - a.timestamp)

  const board = useMemo(() => {
    if (rankTab === 'age') {
      return leaderboard(runs, id, (uid) => getHiker(uid)?.age === ageBracket)
    }
    if (rankTab === 'level') {
      return leaderboard(runs, id, (uid) => getHiker(uid)?.level === experience)
    }
    const all = leaderboard(runs, id)
    if (rankTab === 'improved') {
      return [...all].sort((a, b) => (b.improved ?? 0) - (a.improved ?? 0))
    }
    return all
  }, [runs, id, rankTab, ageBracket, experience])

  const yourRank = board.findIndex((r) => r.userId === CURRENT_USER_ID) + 1
  const nextTarget = pb ? Math.round(pb * 0.99) : chase?.trailId === id ? chase.timeSec : undefined

  const trailConditions = conditions
    .filter((c) => c.trailId === id)
    .map((c) => ({ ...c, conf: conditionConfidence(c.timestamp, c.confirms) }))
    .sort((a, b) => b.timestamp - a.timestamp)

  const trailReviews = reviews
    .filter((r) => r.trailId === id)
    .sort((a, b) => b.timestamp - a.timestamp)

  const avgRating = trailReviews.length
    ? trailReviews.reduce((s, r) => s + r.rating, 0) / trailReviews.length
    : 0

  if (!trail) {
    return (
      <div className="page page-pad">
        <p>Trail not found.</p>
        <Link to="/explore">Back to explore</Link>
      </div>
    )
  }

  const activeChaseHere = chase?.trailId === id

  return (
    <div className="page" style={{ paddingBottom: calcDock() }}>
      <div style={{ position: 'relative', height: 280 }}>
        <TrailMap
          trails={[trail]}
          selectedId={trail.id}
          focus={trail.center}
          zoom={12.2}
          route={trail.path}
          interactive
        />
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, padding: '10px 14px' }}
        >
          ← Back
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => toggleSaveTrail(trail.id)}
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, padding: '10px 14px' }}
        >
          {savedTrailIds.includes(trail.id) ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="page-pad" style={{ marginTop: -28, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(250,252,251,0.95)',
            borderRadius: 24,
            padding: 18,
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <p className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {trail.region}
          </p>
          <h1 className="display" style={{ fontSize: '2rem', fontWeight: 800, marginTop: 4 }}>
            {trail.name}
          </h1>
          <p style={{ marginTop: 8, color: 'var(--ink-soft)', lineHeight: 1.45 }}>{trail.summary}</p>

          <div className="stat-grid" style={{ marginTop: 16 }}>
            <div className="stat-tile"><div className="v">{formatKm(trail.distKm)}</div><div className="l">Distance</div></div>
            <div className="stat-tile"><div className="v">{formatGain(trail.gainM)}</div><div className="l">Gain</div></div>
            <div className="stat-tile"><div className="v">{trail.typicalMin}m</div><div className="l">Typical</div></div>
            <div className="stat-tile"><div className="v pb-gold">{pb ? formatTime(pb) : '—'}</div><div className="l">Your PB</div></div>
          </div>

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => navigate(`/record?trail=${trail.id}`)}
            >
              Record hike
            </button>
            <button
              className="btn btn-gold"
              onClick={() => {
                if (activeChaseHere) {
                  navigate(`/record?trail=${trail.id}`)
                } else if (board[0] && board[0].userId !== CURRENT_USER_ID) {
                  setChase({
                    trailId: trail.id,
                    userId: board[0].userId,
                    timeSec: board[0].timeSec,
                    label: getHiker(board[0].userId)?.name ?? 'Rival',
                  })
                } else if (pb) {
                  setChase({
                    trailId: trail.id,
                    userId: CURRENT_USER_ID,
                    timeSec: Math.round(pb * 0.99),
                    label: 'Your next target',
                  })
                }
              }}
            >
              {activeChaseHere ? 'Chase now' : 'Set chase'}
            </button>
          </div>
        </motion.div>

        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Elevation</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Drag to scrub the climb</p>
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 16, border: '1px solid var(--line)', padding: 8 }}>
            <ElevationProfile elevation={trail.elevation} interactive />
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div className="segmented">
            {([
              ['performance', 'Performance'],
              ['conditions', 'Conditions'],
              ['reviews', 'Reviews'],
            ] as const).map(([key, label]) => (
              <button key={key} className={detailTab === key ? 'active' : ''} onClick={() => setDetailTab(key)}>
                {label}
                {key === 'reviews' && trailReviews.length ? ` (${trailReviews.length})` : ''}
              </button>
            ))}
          </div>
        </div>

        {detailTab === 'performance' && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(10,138,130,0.1))',
                border: '1px solid var(--line)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                Next target
              </p>
              <p className="display" style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}>
                {nextTarget ? formatTime(nextTarget) : 'Log a hike to unlock'}
              </p>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {pb
                  ? '1% under your best — progress first.'
                  : activeChaseHere
                    ? `Chasing ${chase?.label}`
                    : 'Set a chase from the rankings below.'}
              </p>
            </div>

            {history.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Your times</h3>
                <HistoryBars times={history.map((h) => h.timeSec)} />
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {history.slice(0, 5).map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span className="muted">{relativeTime(h.timestamp)} · {h.conditions.join(', ')}</span>
                      <strong className={h.timeSec === pb ? 'pb-gold' : ''}>{formatTime(h.timeSec)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Rankings</h3>
                {yourRank > 0 && <span className="muted" style={{ fontSize: 13 }}>You’re #{yourRank}</span>}
              </div>
              <div className="segmented" style={{ marginTop: 10 }}>
                {([
                  ['everyone', 'Everyone'],
                  ['age', 'My age'],
                  ['level', 'My level'],
                  ['improved', 'Improved'],
                ] as const).map(([key, label]) => (
                  <button key={key} className={rankTab === key ? 'active' : ''} onClick={() => setRankTab(key)}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {board.slice(0, 8).map((row, i) => {
                  const hiker = getHiker(row.userId)
                  const isYou = row.userId === CURRENT_USER_ID
                  return (
                    <div
                      key={row.userId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr auto auto',
                        gap: 10,
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 14,
                        background: isYou ? 'rgba(10,138,130,0.1)' : 'rgba(255,255,255,0.7)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: i < 3 ? 'var(--gold)' : 'var(--ink-soft)' }}>
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ fontWeight: 700 }}>{isYou ? 'You' : hiker?.name}</p>
                        <p className="muted" style={{ fontSize: 12 }}>
                          {hiker?.age} · {hiker?.level}
                          {rankTab === 'improved' && row.improved ? ` · −${formatTime(row.improved)}` : ''}
                        </p>
                      </div>
                      <strong>{formatTime(row.timeSec)}</strong>
                      {!isYou && (
                        <button
                          className="chip"
                          style={{ margin: 0 }}
                          onClick={() =>
                            setChase({
                              trailId: trail.id,
                              userId: row.userId,
                              timeSec: row.timeSec,
                              label: hiker?.name ?? 'Rival',
                            })
                          }
                        >
                          Chase
                        </button>
                      )}
                    </div>
                  )
                })}
                {!board.length && <p className="muted">No times yet — be first.</p>}
              </div>
            </div>
          </div>
        )}

        {detailTab === 'conditions' && (
          <div style={{ marginTop: 16 }}>
            <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
              Reports fade as they age. Confirm “still true” to keep them alive.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {trailConditions.map((c) => {
                const author = getHiker(c.userId)
                const stale = c.conf < 0.35
                return (
                  <div
                    key={c.id}
                    className={stale ? 'fade-report' : undefined}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.75)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontWeight: 800 }}>{c.tags.join(' · ')}</p>
                      <span className="muted" style={{ fontSize: 12 }}>{relativeTime(c.timestamp)}</span>
                    </div>
                    {c.note && <p style={{ marginTop: 6, fontSize: 14 }}>{c.note}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {author?.name} · confidence {Math.round(c.conf * 100)}%
                      </span>
                      <button className="chip" onClick={() => confirmCondition(c.id)}>
                        Still true · {c.confirms}
                      </button>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        height: 4,
                        borderRadius: 999,
                        background: 'rgba(16,32,30,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: `${c.conf * 100}%`, height: '100%', background: 'var(--teal)' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.75)', border: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Report conditions</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {['Dry', 'Muddy', 'Snow', 'Icy', 'Bugs', 'Busy', 'Closed'].map((tag) => (
                  <button
                    key={tag}
                    className={`chip ${condTags.includes(tag) ? 'active' : ''}`}
                    onClick={() =>
                      setCondTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 12 }}
                disabled={!condTags.length}
                onClick={() => {
                  addCondition(trail.id, condTags as never, undefined)
                  setCondTags(['Dry'])
                }}
              >
                Post report
              </button>
            </div>
          </div>
        )}

        {detailTab === 'reviews' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <p className="display" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {avgRating ? avgRating.toFixed(1) : '—'}
              </p>
              <p className="muted">{trailReviews.length} reviews · first-party, crew-aware</p>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {trailReviews.map((r) => {
                const author = getHiker(r.userId) ?? hikers[0]
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.75)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontWeight: 800 }}>{author.name}</p>
                      <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{'★'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.45 }}>{r.text}</p>
                    <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>{relativeTime(r.timestamp)}</p>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.75)', border: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Write a review</h3>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className="chip"
                    style={{ color: n <= rating ? 'var(--gold)' : undefined }}
                    onClick={() => setRating(n)}
                  >
                    ★ {n}
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Trail notes for the next hiker…"
                rows={3}
                style={{
                  width: '100%',
                  marginTop: 10,
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  padding: 12,
                  resize: 'vertical',
                  background: 'white',
                }}
              />
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 10 }}
                disabled={reviewText.trim().length < 4}
                onClick={() => {
                  addReview(trail.id, rating, reviewText.trim())
                  setReviewText('')
                }}
              >
                Publish review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function calcDock() {
  return 'calc(var(--dock-h) + 28px)'
}

function HistoryBars({ times }: { times: number[] }) {
  const max = Math.max(...times, 1)
  const min = Math.min(...times)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginTop: 10 }}>
      {[...times].reverse().slice(-8).map((t, i) => {
        const h = 18 + ((max - t) / (max - min || 1)) * 46
        const isBest = t === min
        return (
          <motion.div
            key={`${t}-${i}`}
            initial={{ height: 0 }}
            animate={{ height: h }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              flex: 1,
              borderRadius: 8,
              background: isBest
                ? 'linear-gradient(180deg, #fbbf24, #d97706)'
                : 'linear-gradient(180deg, #4fd1c5, #0a8a82)',
              minWidth: 12,
            }}
            title={formatTime(t)}
          />
        )
      })}
    </div>
  )
}
