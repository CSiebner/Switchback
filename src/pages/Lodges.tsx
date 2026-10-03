import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function Lodges() {
  const lodges = useAppStore((s) => s.lodges)
  const joinedLodgeIds = useAppStore((s) => s.joinedLodgeIds)
  const createLodge = useAppStore((s) => s.createLodge)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('Alberta')

  return (
    <div className="page">
      <div className="container page-pad">
        <p className="survey">The wider room</p>
        <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, lineHeight: 0.95, marginTop: 8 }}>
          Lodges
        </h1>
        <p style={{ marginTop: 12, lineHeight: 1.45 }}>
          A lodge is everyone who hikes a place. Bow Valley is one. Hike Alberta would be another. Your crew is the table inside it.
        </p>
        <div style={{ marginTop: 18 }}>
          {lodges.map((lodge) => (
            <Link key={lodge.id} to={`/lodge/${lodge.id}`} className="hairline" style={{ display: 'block', padding: '16px 0' }}>
              <span className="survey">{lodge.region}{joinedLodgeIds.includes(lodge.id) ? ' · You are in' : ''}</span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 'var(--type-lg)', marginTop: 4 }}>{lodge.name}</span>
              <span className="survey" style={{ display: 'block', marginTop: 4 }}>
                {lodge.memberIds.length} hikers · {lodge.crewIds.length} {lodge.crewIds.length === 1 ? 'crew' : 'crews'}
              </span>
            </Link>
          ))}
        </div>
        <section style={{ marginTop: 28 }}>
          <h2 className="chapter">Start a lodge</h2>
          <p className="survey" style={{ marginTop: 6 }}>Name the place. You can make it as wide as a province.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hike Alberta"
            aria-label="Lodge name"
            style={{ width: '100%', marginTop: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
          />
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Where"
            aria-label="Region"
            style={{ width: '100%', marginTop: 8, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--contour-light)', background: 'transparent', color: 'inherit' }}
          />
          <button
            className="btn btn-larch"
            style={{ width: '100%', marginTop: 12 }}
            disabled={name.trim().length < 2}
            onClick={() => {
              createLodge(name, region)
              setName('')
            }}
          >
            Create lodge
          </button>
        </section>
      </div>
    </div>
  )
}
