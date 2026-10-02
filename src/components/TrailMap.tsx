import { useEffect, useRef } from 'react'
import { GeoJSONSource, LngLatBounds, Map, Marker } from 'maplibre-gl'
import type { Feature, FeatureCollection } from 'geojson'
import '../lib/maplibre'
import type { Trail } from '../data/seed'
import { cumulativeDistances, pointAlong, slicePath, bearingBetween, type LngLat } from '../lib/geo'

export type MapMood = 'day' | 'dusk'

interface Props {
  trails: Trail[]
  selectedId?: string
  onSelect?: (id: string) => void
  route?: LngLat[]
  /** Faint context lines for every trail in view (Explore). */
  routes?: { id: string; coords: LngLat[] }[]
  youProgress?: number
  ghostProgress?: number
  /**
   * Imperative animation driver. When provided, TrailMap runs its own rAF loop and
   * writes you/ghost progress straight to the map sources, bypassing React state
   * (60fps setState starves React Router's startTransition navigations).
   */
  animate?: (nowMs: number) => { you?: number; ghost?: number }
  mood?: MapMood
  pitch?: number
  follow?: boolean
  fit?: boolean
  /** Fit every trail once, and do not zoom to the selected line until this is false. */
  fitAll?: boolean
  fitPadding?: { top: number; bottom: number; left: number; right: number }
  interactive?: boolean
  className?: string
  pinClass?: (trail: Trail) => string
}

const TERRAIN_SOURCE = 'terrarium-dem'
const SRC_ROUTE = 'route'
const SRC_ALL = 'routes-all'
const SRC_DONE = 'route-done'
const SRC_GAP = 'route-gap'
const SRC_YOU = 'you'
const SRC_GHOST = 'ghost'
const SRC_GHOST_TAIL = 'ghost-tail'

function ensureTerrain(map: Map, mood: MapMood) {
  if (!map.getSource(TERRAIN_SOURCE)) {
    map.addSource(TERRAIN_SOURCE, {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 14,
      attribution: 'Terrain: Mapzen / AWS Open Data',
    })
  }
  if (!map.getLayer('hillshade')) {
    const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
    map.addLayer(
      {
        id: 'hillshade',
        type: 'hillshade',
        source: TERRAIN_SOURCE,
        paint: {
          'hillshade-exaggeration': mood === 'dusk' ? 0.6 : 0.48,
          'hillshade-shadow-color': mood === 'dusk' ? '#030a09' : '#3f5a55',
          'hillshade-highlight-color': mood === 'dusk' ? '#1f4a45' : '#ffffff',
          'hillshade-accent-color': mood === 'dusk' ? '#0b1716' : '#8da8a2',
        },
      },
      firstSymbol,
    )
  }
  map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 1.35 })
}

function applyMood(map: Map, mood: MapMood) {
  const layers = map.getStyle().layers
  for (const layer of layers) {
    if (layer.id === 'hillshade' || layer.id.startsWith('sb-')) continue
    try {
      if (layer.type === 'symbol') {
        const isPlace = /place|peak|mountain|natural|water_name|poi/.test(layer.id)
        map.setLayoutProperty(layer.id, 'visibility', isPlace ? 'visible' : 'none')
        if (isPlace) {
          map.setPaintProperty(layer.id, 'text-color', mood === 'dusk' ? '#8fa6a1' : '#3d524e')
          map.setPaintProperty(layer.id, 'text-halo-color', mood === 'dusk' ? '#0b1716' : '#e4eeeb')
          map.setPaintProperty(layer.id, 'text-halo-width', 1.2)
        }
      } else if (layer.type === 'background') {
        map.setPaintProperty(layer.id, 'background-color', mood === 'dusk' ? '#0b1716' : '#e4eeeb')
      } else if (layer.type === 'fill') {
        if (/water/.test(layer.id)) {
          map.setPaintProperty(layer.id, 'fill-color', mood === 'dusk' ? '#0f2f33' : '#b9d9d6')
        } else if (/landcover|landuse|park|wood|grass|forest/.test(layer.id)) {
          map.setPaintProperty(layer.id, 'fill-color', mood === 'dusk' ? '#102421' : '#d3e2dd')
          map.setPaintProperty(layer.id, 'fill-opacity', 0.9)
        } else if (/building/.test(layer.id)) {
          map.setLayoutProperty(layer.id, 'visibility', 'none')
        } else {
          map.setPaintProperty(layer.id, 'fill-color', mood === 'dusk' ? '#0d1b1a' : '#dde9e5')
        }
      } else if (layer.type === 'line') {
        if (/water|river|stream|canal/.test(layer.id)) {
          map.setPaintProperty(layer.id, 'line-color', mood === 'dusk' ? '#1a4a4e' : '#9fcac6')
        } else if (/boundary|admin/.test(layer.id)) {
          map.setLayoutProperty(layer.id, 'visibility', 'none')
        } else if (/path|track|footway|trail|cycleway/.test(layer.id)) {
          map.setPaintProperty(layer.id, 'line-color', mood === 'dusk' ? '#2c4f4b' : '#9bb5b0')
          map.setPaintProperty(layer.id, 'line-opacity', 0.8)
        } else {
          map.setPaintProperty(layer.id, 'line-color', mood === 'dusk' ? '#1b3330' : '#c6d6d2')
          map.setPaintProperty(layer.id, 'line-opacity', 0.65)
        }
      } else if (layer.type === 'fill-extrusion') {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
    } catch {
      // some layers reject certain properties; ignore
    }
  }
}

function lineFeature(coords: LngLat[]): Feature {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }
}

function pointFeature(coord: LngLat): Feature {
  return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coord } }
}

const empty: FeatureCollection = { type: 'FeatureCollection', features: [] }

function upsert(map: Map, id: string, data: Feature | FeatureCollection) {
  const src = map.getSource(id) as GeoJSONSource | undefined
  if (src) src.setData(data)
  else map.addSource(id, { type: 'geojson', data, lineMetrics: true })
}

function ensureRouteLayers(map: Map, mood: MapMood) {
  if (!map.getSource(SRC_ROUTE)) {
    upsert(map, SRC_ALL, empty)
    upsert(map, SRC_ROUTE, empty)
    upsert(map, SRC_DONE, empty)
    upsert(map, SRC_GAP, empty)
    upsert(map, SRC_GHOST_TAIL, empty)
    upsert(map, SRC_YOU, empty)
    upsert(map, SRC_GHOST, empty)
  }
  const dusk = mood === 'dusk'

  const add = (layer: Parameters<Map['addLayer']>[0]) => {
    if (!map.getLayer(layer.id)) map.addLayer(layer)
  }

  add({
    id: 'sb-routes-all',
    type: 'line',
    source: SRC_ALL,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dusk ? '#2a5d58' : '#0a8a82', 'line-width': 3.5, 'line-opacity': dusk ? 0.7 : 0.9 },
  })
  add({
    id: 'sb-route-casing',
    type: 'line',
    source: SRC_ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dusk ? '#06110f' : '#f3f8f6', 'line-width': 7.5, 'line-opacity': dusk ? 0.9 : 0.85 },
  })
  add({
    id: 'sb-route',
    type: 'line',
    source: SRC_ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dusk ? '#2fd4c4' : '#06685f', 'line-width': 5, 'line-opacity': 1 },
  })
  add({
    id: 'sb-route-glow',
    type: 'line',
    source: SRC_DONE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#2fd4c4', 'line-width': 14, 'line-blur': 10, 'line-opacity': dusk ? 0.5 : 0.25 },
  })
  add({
    id: 'sb-route-done',
    type: 'line',
    source: SRC_DONE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dusk ? '#2fd4c4' : '#0a8a82', 'line-width': 4.5 },
  })
  add({
    id: 'sb-gap',
    type: 'line',
    source: SRC_GAP,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#f5b544', 'line-width': 6, 'line-opacity': 0.9 },
  })
  add({
    id: 'sb-ghost-tail',
    type: 'line',
    source: SRC_GHOST_TAIL,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-width': 9,
      'line-blur': 2,
      'line-gradient': [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0,
        'rgba(245,181,68,0)',
        1,
        'rgba(245,181,68,0.95)',
      ],
    },
  })
  add({
    id: 'sb-ghost',
    type: 'circle',
    source: SRC_GHOST,
    paint: {
      'circle-radius': 9,
      'circle-color': '#f5b544',
      'circle-stroke-width': 2.5,
      'circle-stroke-color': dusk ? '#0b1716' : '#ffffff',
      'circle-blur': 0.15,
    },
  })
  add({
    id: 'sb-ghost-halo',
    type: 'circle',
    source: SRC_GHOST,
    paint: { 'circle-radius': 22, 'circle-color': '#f5b544', 'circle-opacity': 0.18, 'circle-blur': 1 },
  })
  add({
    id: 'sb-you-halo',
    type: 'circle',
    source: SRC_YOU,
    paint: { 'circle-radius': 20, 'circle-color': '#2fd4c4', 'circle-opacity': 0.22, 'circle-blur': 1 },
  })
  add({
    id: 'sb-you',
    type: 'circle',
    source: SRC_YOU,
    paint: {
      'circle-radius': 8,
      'circle-color': dusk ? '#2fd4c4' : '#0a8a82',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff',
    },
  })
}

function drawProgress(
  map: Map,
  route: LngLat[],
  cum: number[],
  youProgress: number | undefined,
  ghostProgress: number | undefined,
  followPitch: number | undefined,
) {
  if (youProgress !== undefined) {
    const you = pointAlong(route, cum, youProgress)
    upsert(map, SRC_YOU, pointFeature(you))
    upsert(map, SRC_DONE, lineFeature(slicePath(route, cum, 0, youProgress)))

    if (followPitch !== undefined) {
      const ahead = pointAlong(route, cum, Math.min(1, youProgress + 0.03))
      map.easeTo({
        center: you,
        bearing: bearingBetween(you, ahead),
        pitch: followPitch,
        zoom: Math.max(map.getZoom(), 14),
        duration: 450,
        easing: (t) => t,
      })
    }
  } else {
    upsert(map, SRC_YOU, empty)
    upsert(map, SRC_DONE, empty)
  }

  if (ghostProgress !== undefined) {
    const ghost = pointAlong(route, cum, ghostProgress)
    upsert(map, SRC_GHOST, pointFeature(ghost))
    const tailLen = 0.06
    upsert(map, SRC_GHOST_TAIL, lineFeature(slicePath(route, cum, Math.max(0, ghostProgress - tailLen), ghostProgress)))
    if (youProgress !== undefined) {
      upsert(map, SRC_GAP, lineFeature(slicePath(route, cum, youProgress, ghostProgress)))
    }
  } else {
    upsert(map, SRC_GHOST, empty)
    upsert(map, SRC_GHOST_TAIL, empty)
    upsert(map, SRC_GAP, empty)
  }
}

export function TrailMap({
  trails,
  selectedId,
  onSelect,
  route,
  routes,
  youProgress,
  ghostProgress,
  animate,
  mood = 'day',
  pitch = 0,
  follow = false,
  fit = true,
  fitAll = false,
  fitPadding,
  interactive = true,
  className,
  pinClass,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const readyRef = useRef(false)
  const lastFitRef = useRef<string>('')
  const animateRef = useRef(animate)
  animateRef.current = animate

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: route?.[0] ?? trails[0]?.center ?? [-115.35, 51.05],
      zoom: 11.5,
      pitch,
      attributionControl: false,
      interactive,
      maxPitch: 75,
      fadeDuration: 0,
    })
    mapRef.current = map
    map.once('load', () => {
      applyMood(map, mood)
      ensureTerrain(map, mood)
      ensureRouteLayers(map, mood)
      readyRef.current = true
      if (interactive) {
        map.dragPan.enable()
        map.scrollZoom.enable()
        map.touchZoomRotate.enable()
      }
      map.fire('sb-ready' as never)
    })
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
      readyRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mood change re-paints
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const run = () => {
      applyMood(map, mood)
      ;['sb-route-casing', 'sb-route', 'sb-route-done', 'sb-you', 'sb-ghost'].forEach((id) => {
        if (!map.getLayer(id)) return
        if (id === 'sb-route-casing') map.setPaintProperty(id, 'line-color', mood === 'dusk' ? '#06110f' : '#f3f8f6')
        if (id === 'sb-route') {
          map.setPaintProperty(id, 'line-color', mood === 'dusk' ? '#2fd4c4' : '#06685f')
          map.setPaintProperty(id, 'line-opacity', 1)
        }
        if (id === 'sb-route-done') map.setPaintProperty(id, 'line-color', mood === 'dusk' ? '#2fd4c4' : '#0a8a82')
        if (id === 'sb-you') map.setPaintProperty(id, 'circle-color', mood === 'dusk' ? '#2fd4c4' : '#0a8a82')
      })
      if (map.getLayer('hillshade')) {
        map.setPaintProperty('hillshade', 'hillshade-exaggeration', mood === 'dusk' ? 0.6 : 0.48)
        map.setPaintProperty('hillshade', 'hillshade-shadow-color', mood === 'dusk' ? '#030a09' : '#3f5a55')
        map.setPaintProperty('hillshade', 'hillshade-highlight-color', mood === 'dusk' ? '#1f4a45' : '#ffffff')
        map.setPaintProperty('hillshade', 'hillshade-accent-color', mood === 'dusk' ? '#0b1716' : '#8da8a2')
      }
    }
    if (readyRef.current) run()
    else map.once('sb-ready' as never, run)
  }, [mood])

  // Pitch
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ pitch, duration: 700, easing: (t) => 1 - Math.pow(1 - t, 3) })
  }, [pitch])

  // Pins
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    trails.forEach((trail) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `trail-pin ${pinClass?.(trail) ?? ''}`
      el.style.transform = selectedId === trail.id ? 'scale(1.4)' : 'scale(1)'
      el.title = trail.name
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect?.(trail.id)
      })
      markersRef.current.push(new Marker({ element: el }).setLngLat(trail.center).addTo(map))
    })
  }, [trails, selectedId, onSelect, pinClass])

  // Context lines for all trails
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const draw = () => {
      ensureRouteLayers(map, mood)
      upsert(map, SRC_ALL, {
        type: 'FeatureCollection',
        features: (routes ?? []).map((r) => ({ ...lineFeature(r.coords), properties: { id: r.id } })),
      })
    }
    if (readyRef.current) draw()
    else map.once('sb-ready' as never, draw)
  }, [routes, mood])

  // Route, progress, ghost
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const draw = () => {
      ensureRouteLayers(map, mood)
      const cloud = fitAll ? (routes ?? []).flatMap((r) => r.coords) : (route ?? [])
      const routeKey = (route ?? []).map((c) => c.join(',')).join('|')
      const key = fitAll ? 'overview' : `${selectedId ?? ''}::${routeKey}`
      if (fit && cloud.length > 1 && lastFitRef.current !== key) {
        lastFitRef.current = key
        const b = cloud.reduce(
          (acc, c) => acc.extend(c as [number, number]),
          new LngLatBounds(cloud[0], cloud[0]),
        )
        map.fitBounds(b, {
          padding: fitPadding ?? { top: 80, bottom: 220, left: 40, right: 40 },
          pitch,
          duration: 900,
          maxZoom: fitAll ? 11 : 14,
        })
      }

      if (!route || route.length < 2) {
        upsert(map, SRC_ROUTE, empty)
        upsert(map, SRC_DONE, empty)
        upsert(map, SRC_GAP, empty)
        upsert(map, SRC_GHOST_TAIL, empty)
        upsert(map, SRC_YOU, empty)
        upsert(map, SRC_GHOST, empty)
        return
      }
      const cum = cumulativeDistances(route)
      upsert(map, SRC_ROUTE, lineFeature(route))

      if (animateRef.current) return
      drawProgress(map, route, cum, youProgress, ghostProgress, follow ? pitch : undefined)
    }

    if (readyRef.current) draw()
    else map.once('sb-ready' as never, draw)
  }, [route, routes, selectedId, youProgress, ghostProgress, follow, fit, fitAll, pitch, mood, fitPadding])

  // Imperative animation loop (no React state per frame)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !animate || !route || route.length < 2) return
    const cum = cumulativeDistances(route)
    let raf = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!readyRef.current) return
      const { you, ghost } = animateRef.current!(now)
      drawProgress(map, route, cum, you, ghost, follow ? pitch : undefined)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [animate, route, follow, pitch])

  return (
    <div className={className ?? 'map-wrap'}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <span className={`map-attrib ${mood}`} aria-label="Map attribution">
        © OpenStreetMap · OpenFreeMap · terrain Mapzen/AWS
      </span>
    </div>
  )
}
