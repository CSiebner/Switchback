import { useEffect, useState } from 'react'
import { fetchForecast, skyLabel, type Forecast } from '../lib/weather'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeatherWeek({ lat, lng, compact = false }: { lat: number; lng: number; compact?: boolean }) {
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
  return (
    <section style={{ marginTop: 22 }}>
      <p className="survey">Weather · {skyLabel(forecast.code).toLowerCase()}</p>
      <p className="display" style={{ fontSize: 'var(--type-xl)', fontWeight: 800, marginTop: 4, lineHeight: 1 }}>
        {Math.round(forecast.temp)}°
      </p>
      <p className="survey num" style={{ marginTop: 6 }}>
        wind {Math.round(forecast.wind)} km/h
        {todayPrecip > 0 ? ` · ${todayPrecip.toFixed(1)} mm today` : ' · dry today'}
        {todayPrecip < 1 ? ' · dirt likely dry' : ' · expect mud'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 14 }}>
        {forecast.days.map((d) => {
          const day = DAYS[new Date(d.date + 'T12:00:00').getDay()]
          return (
            <div key={d.date} style={{ textAlign: 'center' }}>
              <p className="survey">{day}</p>
              <p className="num" style={{ fontWeight: 800, marginTop: 4 }}>{Math.round(d.max)}°</p>
              <p className="survey">{Math.round(d.min)}°</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
