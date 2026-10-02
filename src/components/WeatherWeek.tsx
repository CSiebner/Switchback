import { useEffect, useState } from 'react'
import { fetchForecast, skyLabel, type Forecast } from '../lib/weather'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
      <p className="survey num">
        {Math.round(forecast.temp)}° {skyLabel(forecast.code).toLowerCase()} · wind {Math.round(forecast.wind)} km/h
      </p>
    )
  }

  const todayPrecip = forecast.days[0]?.precip ?? 0
  const dirt = todayPrecip < 1 ? 'dirt likely dry' : 'expect mud'
  return (
    <section className={band ? 'tr-weather' : undefined} style={band ? undefined : { marginTop: 40 }}>
      <p className="display" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: band ? 'var(--rock-flour)' : undefined }}>
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
              <p className="num" style={{ fontWeight: 800, marginTop: 4 }}>{Math.round(d.max)}°</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
