# Switchback

AllTrails tells you where a trail is. **Switchback is what you do when you go back.**

Go back. Get faster. Go with your crew.

1. **Your time** — the first person you race is you. A dry day and a muddy day are not the same record.
2. **Who's ahead** — one person on the same trail. Race their time. Rankings can match age and experience.
3. **Your crew** — the people you actually hike with. A plan, a meeting point, a pace.

## Run

```bash
npm install
npm run dev
```

## Prototype scope

- Progress-first home (active chase, your trails, crew pulse)
- Explore map (MapLibre + OpenFreeMap outdoors)
- Trail detail: elevation scrub, PBs, fair rankings, fading conditions, first-party reviews
- Record: ghost HUD, pause/resume, finish → result payoff
- Crews: challenges, partner beacons, local feed + kudos
- You: totals, per-trail bests, active chase

Data persists in `localStorage`. Bow Valley / Kananaskis seed trails are approximate for demo.

## Stack

Vite · React · TypeScript · MapLibre · Zustand · Framer Motion
