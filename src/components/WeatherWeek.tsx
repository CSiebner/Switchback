import { useEffect, useState } from 'react'
import { fetchForecast, skyLabel, type Forecast } from '../lib/weather'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function skyKind(code: number): 'clear' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm' {
  if (code === 0) return 'clear'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 95) return 'storm'
  if (code >= 51) return 'rain'
  if (code <= 3) return 'cloud'
  return 'cloud'
}

function SkyMark({ code, size = 28 }: { code: number; size?: number }) {
  const kind = skyKind(code)
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {kind === 'clear' && <circle cx="12" cy="12" r="4" {...common} />}
      {kind === 'clear' && (
        <path {...common} d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
      )}
      {(kind === 'cloud' || kind === 'rain' || kind === 'snow' || kind === 'storm') && (
        <path {...common} d="M7 16h9a3.5 3.5 0 0 0 .4-7 4.5 4.5 0 0 0-8.6-1.2A3.2 3.2 0 0 0 7 16z" />
      )}
      {kind === 'fog' && <path {...common} d="M4 9h16M3 12h18M5 15h14M7 18h10" />}
      {kind === 'rain' && <path {...common} d="M8 18.5l-.8 1.6M12 18.5l-.8 1.6M16 18.5l-.8 1.6" />}
      {kind === 'snow' && <path {...common} d="M8 19h.1M12 19h.1M16 19h.1" />}
      {kind === 'storm' && <path {...common} d="M13 16.5 10.5 20h3L12 23" />}
    </svg>
  )
}

export function WeatherWeek({ lat, lng, compact = false, band = false }: { lat: number; lng: number; compact?: boolean; band?: boolean }) {
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    fetchForecast(lat, lng)
      .then((f) => live && setForecast(f))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [lat, lng])

  if (failed) return null
  if (!forecast) return <p className="survey">Reading the sky…</p>

  if (compact) {
    return (
      <p className="survey num" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <SkyMark code={forecast.code} size={16} />
        {Math.round(forecast.temp)}° {skyLabel(forecast.code).toLowerCase()} · wind {Math.round(forecast.wind)} km/h
      </p>
    )
  }

  const todayPrecip = forecast.days[0]?.precip ?? 0
  const dirt = todayPrecip < 1 ? 'trail likely dry' : 'expect mud'
  return (
    <section className={band ? 'tr-weather' : undefined} style={band ? undefined : { marginTop: 40 }}>
      <p className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: band ? 'var(--rock-flour)' : undefined }}>
        <SkyMark code={forecast.code} />
        {Math.round(forecast.temp)}° {skyLabel(forecast.code)}
      </p>
      <p className="survey num" style={{ marginTop: 6 }}>
        wind {Math.round(forecast.wind)} km/h · {dirt}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 18 }}>
        {forecast.days.map((d) => {
          const day = DAYS[new Date(d.date + 'T12:00:00').getDay()]
          return (
            <div key={d.date} style={{ textAlign: 'center', minWidth: 0 }}>
              <p className="survey">{day}</p>
              <span style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}><SkyMark code={d.code} size={16} /></span>
              <p className="num" style={{ fontWeight: 800, marginTop: 2 }}>{Math.round(d.max)}°</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
