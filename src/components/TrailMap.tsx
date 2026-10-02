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
  youProgress?: number
  ghostProgress?: number
  mood?: MapMood
  pitch?: number
  follow?: boolean
  fit?: boolean
  fitPadding?: { top: number; bottom: number; left: number; right: number }
  interactive?: boolean
  className?: string
  pinClass?: (trail: Trail) => string
}

const TERRAIN_SOURCE = 'terrarium-dem'
const SRC_ROUTE = 'route'
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
          'hillshade-exaggeration': mood === 'dusk' ? 0.55 : 0.32,
          'hillshade-shadow-color': mood === 'dusk' ? '#030a09' : '#4e6c66',
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
    id: 'sb-route-casing',
    type: 'line',
    source: SRC_ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dusk ? '#06110f' : '#0f201e', 'line-width': 7, 'line-opacity': dusk ? 0.9 : 0.75 },
  })
  add({
    id: 'sb-route',
    type: 'line',
    source: SRC_ROUTE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': dusk ? '#2a5d58' : '#9fc3be', 'line-width': 3.5 },
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

export function TrailMap({
  trails,
  selectedId,
  onSelect,
  route,
  youProgress,
  ghostProgress,
  mood = 'day',
  pitch = 0,
  follow = false,
  fit = true,
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
        if (id === 'sb-route-casing') map.setPaintProperty(id, 'line-color', mood === 'dusk' ? '#06110f' : '#0f201e')
        if (id === 'sb-route') map.setPaintProperty(id, 'line-color', mood === 'dusk' ? '#2a5d58' : '#9fc3be')
        if (id === 'sb-route-done') map.setPaintProperty(id, 'line-color', mood === 'dusk' ? '#2fd4c4' : '#0a8a82')
        if (id === 'sb-you') map.setPaintProperty(id, 'circle-color', mood === 'dusk' ? '#2fd4c4' : '#0a8a82')
      })
      if (map.getLayer('hillshade')) {
        map.setPaintProperty('hillshade', 'hillshade-exaggeration', mood === 'dusk' ? 0.55 : 0.32)
        map.setPaintProperty('hillshade', 'hillshade-shadow-color', mood === 'dusk' ? '#030a09' : '#4e6c66')
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

  // Route, progress, ghost
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const draw = () => {
      ensureRouteLayers(map, mood)
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

      const key = route.map((c) => c.join(',')).join('|')
      if (fit && lastFitRef.current !== key) {
        lastFitRef.current = key
        const b = route.reduce(
          (acc, c) => acc.extend(c as [number, number]),
          new LngLatBounds(route[0], route[0]),
        )
        map.fitBounds(b, {
          padding: fitPadding ?? { top: 80, bottom: 220, left: 40, right: 40 },
          pitch,
          duration: 900,
          maxZoom: 14.2,
        })
      }

      if (youProgress !== undefined) {
        const you = pointAlong(route, cum, youProgress)
        upsert(map, SRC_YOU, pointFeature(you))
        upsert(map, SRC_DONE, lineFeature(slicePath(route, cum, 0, youProgress)))

        if (follow) {
          const ahead = pointAlong(route, cum, Math.min(1, youProgress + 0.03))
          map.easeTo({
            center: you,
            bearing: bearingBetween(you, ahead),
            pitch,
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

    if (readyRef.current) draw()
    else map.once('sb-ready' as never, draw)
  }, [route, youProgress, ghostProgress, follow, fit, pitch, mood, fitPadding])

  return (
    <div className={className ?? 'map-wrap'}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
