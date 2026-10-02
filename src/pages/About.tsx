import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { heroPhoto } from '../data/photos'
import { getTrail } from '../data/trails'
import { Mark } from '../components/Mark'
import { RouteGlyph } from '../components/RouteGlyph'

const ha = getTrail('ha-ling')
const photo = heroPhoto('ha-ling')
const crew = heroPhoto('bow-valley')

/** The idea, in three pictures. `onBegin` is the first-open path into profile setup. */
export function About({ onBegin }: { onBegin?: () => void }) {
  return (
    <div className="page" style={onBegin ? { paddingTop: 0, paddingBottom: 32 } : undefined}>
      <section style={{ position: 'relative', height: 360 }}>
        {photo && <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,23,22,0.25), rgba(11,23,22,0.82))' }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 28, color: 'var(--rock-flour)' }}>
          <Mark tone="flour" />
          <h1 className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 18, lineHeight: 0.95 }}>
            Go back. Get faster. Go with your crew.
          </h1>
        </div>
      </section>

      <div className="container page-pad" style={{ marginTop: 22 }}>
        <p style={{ fontSize: 'var(--type-lg)', fontWeight: 650, lineHeight: 1.35 }}>
          AllTrails tells you where a trail is. Switchback is what you do when you go back — your time, the person just ahead, and the people you hike with.
        </p>

        <Frame
          image={photo?.thumb}
          kicker="1 · Your time"
          title="The same trail, again."
          body="A hike here is a route you can repeat. The first person you measure against is your previous self. A dry day and a muddy day are not the same record."
          mark={ha ? <RouteGlyph coords={ha.path} size={72} stroke="#0f201e" strokeWidth={2.4} /> : null}
        />
        <Frame
          image={heroPhoto('prairie-mountain')?.thumb}
          kicker="2 · Who's ahead"
          title="One person to catch."
          body="On every trail you've hiked, Switchback shows the person just faster than you. Race their time. Rankings can match your age and experience, so the comparison stays fair."
        />
        <Frame
          image={crew?.thumb}
          kicker="3 · Your crew"
          title="The people you go with."
          body="A crew is who you actually hike with. A plan, a meeting point, a pace, and a season of elevation you climbed together. The feed is hikes, not posts."
        />

        <p className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 28, lineHeight: 1.15 }}>
          That's the whole app. Hike, see the gap, tell your crew.
        </p>
        {onBegin ? (
          <button className="btn btn-larch" style={{ width: '100%', marginTop: 18 }} onClick={onBegin}>
            Set up your hikes
          </button>
        ) : (
          <Link to="/" className="btn btn-larch" style={{ width: '100%', marginTop: 18 }}>
            Back to your hikes
          </Link>
        )}
      </div>
    </div>
  )
}

function Frame({ image, kicker, title, body, mark }: { image?: string; kicker: string; title: string; body: string; mark?: ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ position: 'relative', height: 180, borderRadius: 18, overflow: 'hidden' }}>
        {image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(11,23,22,0.55))' }} />
        {mark && <div style={{ position: 'absolute', left: 14, bottom: 12 }}>{mark}</div>}
      </div>
      <p className="survey" style={{ marginTop: 12 }}>{kicker}</p>
      <h2 className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 4 }}>{title}</h2>
      <p style={{ marginTop: 8, lineHeight: 1.45, color: 'var(--scree-dark)' }}>{body}</p>
    </section>
  )
}
