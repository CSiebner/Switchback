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
            The hiking app for the people you go with, and the days you go alone.
          </h1>
        </div>
      </section>

      <div className="container page-pad" style={{ marginTop: 22 }}>
        <p style={{ fontSize: 'var(--type-lg)', fontWeight: 650, lineHeight: 1.35 }}>
          Switchback is the map, the recording, and the memory of the day. It packs your next hike from the weather and the people who were just there. Your crew is who is in the car. Your lodge is everyone who hikes that country.
        </p>
        <div className="pitch-grid">
          <Pitch kicker="Trails" title="Find the line" body="Map, distance, climb, photos, and what the trail is like right now." />
          <Pitch kicker="Record" title="Keep the day" body="Time, weather, and conditions, set beside the last time you walked it." />
          <Pitch kicker="Pack" title="Bring the right things" body="Water, layers, and notes from the lodge. A watch can teach it later." />
          <Pitch kicker="Crew" title="Go with your people" body="A plan, a meeting pin, who is going, and the seats left in the car." />
          <Pitch kicker="Lodge" title="The wider room" body="Weekend plans, fresh reports, and crews challenging each other." />
          <Pitch kicker="You" title="Marks, not noise" body="Accomplishments, a goal you set, and boards for elevation and distance." />
        </div>

        <Frame
          image={photo?.thumb}
          kicker="1 · Your day"
          title="The same trail, with the weather."
          body="Your profile keeps this visit next to the one before it: the time, and the sky and the dirt that day. A muddy afternoon and a dry morning are both yours. Hiking alone is a complete way to use Switchback."
          mark={ha ? <RouteGlyph coords={ha.path} size={72} stroke="#0f201e" strokeWidth={2.4} /> : null}
        />
        <Frame
          image={heroPhoto('prairie-mountain')?.thumb}
          kicker="2 · What to bring"
          title="A pack list that learns."
          body="Water, layers, and the small things come from the forecast, the kind of hike, notes from the lodge, and how long it takes you. When a watch can see the water you actually use, that reading sets the number for the next similar climb."
        />
        <Frame
          image={crew?.thumb}
          kicker="3 · Crew and lodge"
          title="The table, and the room."
          body="A crew is the people in the car: a plan, a meeting spot, a shared season. A lodge is everyone who hikes that country. Crews in a lodge can challenge each other on elevation or distance. You can stand on the hikers board with no crew at all."
        />

        <p className="display" style={{ fontSize: 'var(--type-lg)', fontWeight: 800, marginTop: 28, lineHeight: 1.15 }}>
          Find the trail. Record the day. Bring who you want.
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

function Pitch({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <article className="pitch-card">
      <p className="survey">{kicker}</p>
      <h2 className="display" style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>{title}</h2>
      <p style={{ marginTop: 6, lineHeight: 1.4, color: 'var(--scree-dark)' }}>{body}</p>
    </article>
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
