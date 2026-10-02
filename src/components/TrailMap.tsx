import { useEffect, useRef } from 'react'
import { GeoJSONSource, Map, Marker, NavigationControl } from 'maplibre-gl'
import type { Feature } from 'geojson'
import '../lib/maplibre'
import type { Trail } from '../data/seed'
import { difficultyColor } from '../lib/format'

interface Props {
  trails: Trail[]
  selectedId?: string
  onSelect?: (id: string) => void
  focus?: [number, number]
  zoom?: number
  route?: [number, number][]
  youProgress?: number
  ghostProgress?: number
  className?: string
  interactive?: boolean
}

export function TrailMap({
  trails,
  selectedId,
  onSelect,
  focus,
  zoom = 9.2,
  route,
  youProgress,
  ghostProgress,
  className,
  interactive = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: focus ?? [-115.35, 51.05],
      zoom,
      attributionControl: { compact: true },
      interactive,
    })

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    trails.forEach((trail) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'trail-pin'
      el.style.background = difficultyColor(trail.difficulty)
      el.style.transform = selectedId === trail.id ? 'scale(1.35)' : 'scale(1)'
      el.title = trail.name
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect?.(trail.id)
      })
      const marker = new Marker({ element: el }).setLngLat(trail.center).addTo(map)
      markersRef.current.push(marker)
    })
  }, [trails, selectedId, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focus) return
    map.flyTo({ center: focus, zoom, essential: true, duration: 900 })
  }, [focus, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const draw = () => {
      const sourceId = 'active-route'
      const youId = 'you-marker'
      const ghostId = 'ghost-marker'

      if (!route || route.length < 2) {
        if (map.getLayer('active-route-line')) map.removeLayer('active-route-line')
        if (map.getSource(sourceId)) map.removeSource(sourceId)
        if (map.getLayer(youId)) map.removeLayer(youId)
        if (map.getSource(youId)) map.removeSource(youId)
        if (map.getLayer(ghostId)) map.removeLayer(ghostId)
        if (map.getSource(ghostId)) map.removeSource(ghostId)
        return
      }

      const geo: Feature = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route },
      }

      if (map.getSource(sourceId)) {
        ;(map.getSource(sourceId) as GeoJSONSource).setData(geo)
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geo })
        map.addLayer({
          id: 'active-route-line',
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#0a8a82',
            'line-width': 4,
            'line-opacity': 0.9,
          },
        })
      }

      const pointAt = (t: number): [number, number] => {
        const idx = Math.min(route.length - 1, Math.max(0, t * (route.length - 1)))
        const i0 = Math.floor(idx)
        const i1 = Math.min(route.length - 1, i0 + 1)
        const f = idx - i0
        return [
          route[i0][0] + (route[i1][0] - route[i0][0]) * f,
          route[i0][1] + (route[i1][1] - route[i0][1]) * f,
        ]
      }

      const upsertPoint = (id: string, t: number | undefined, color: string) => {
        if (t === undefined) {
          if (map.getLayer(id)) map.removeLayer(id)
          if (map.getSource(id)) map.removeSource(id)
          return
        }
        const data: Feature = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: pointAt(t) },
        }
        if (map.getSource(id)) {
          ;(map.getSource(id) as GeoJSONSource).setData(data)
        } else {
          map.addSource(id, { type: 'geojson', data })
          map.addLayer({
            id,
            type: 'circle',
            source: id,
            paint: {
              'circle-radius': 7,
              'circle-color': color,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          })
        }
      }

      upsertPoint(youId, youProgress, '#0a8a82')
      upsertPoint(ghostId, ghostProgress, '#fbbf24')
    }

    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
  }, [route, youProgress, ghostProgress])

  return (
    <div className={className ?? 'map-wrap'}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
