# Switchback

AllTrails finds the trail. Strava keeps the workout. **Switchback is the outdoor community those two left in group chats**, starting with hiking.

Hike with your people. Remember the day. Pack the next one.

1. **Your crew** — the plan, the car, and the notes you keep together.
2. **Your last time** — the same trail, with the weather and the conditions that day, set beside the visit before it.
3. **What to bring** — a pack list from the forecast, the kind of hike, recent notes, and how you move. A watch that sees the water you use can replace that estimate later.

Comparing a time is a detail of remembering the day. It is not the product.

## Run

```bash
npm install
npm run dev
```

## Prototype scope

- Home built around the crew's next hike, your last day on that trail, and a pack list
- Explore map (MapLibre + OpenFreeMap outdoors)
- Trail detail: elevation, your history, conditions, reviews, packing
- Record: pause/resume, finish → result
- Crews: the plan, the shared season, the feed of hikes
- You: your days, read with the weather

Data persists in `localStorage`. Bow Valley / Kananaskis seed trails are approximate for demo.

## Stack

Vite · React · TypeScript · MapLibre · Zustand · Framer Motion
