# Switchback

AllTrails finds the trail. Strava keeps the workout. **Switchback is the outdoor community those two left in group chats**, starting with hiking.

Hike with your people. Remember the day. Pack the next one.

1. **Your day** — the same trail, with the weather, whether you went alone or not.
2. **What to bring** — a pack list from the forecast, the hike, lodge notes, and how you move.
3. **Your crew** — optional. The plan, the car, and a challenge against another crew.
4. **A lodge** — everyone who hikes that country. Weekend plans, conditions, and boards for elevation and distance, by crew and by hiker.

The current UI before this lodge work is tagged `backup/ui-crew-home-2026-10-03`.

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
