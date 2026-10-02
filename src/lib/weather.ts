export interface DayForecast {
  date: string
  code: number
  max: number
  min: number
  precip: number
}

export interface Forecast {
  temp: number
  code: number
  wind: number
  precip: number
  days: DayForecast[]
}

const cache = new Map<string, Forecast>()

export function skyLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Cloudy'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 95) return 'Storm'
  if (code >= 51) return 'Rain'
  return 'Cloudy'
}

export async function fetchForecast(lat: number, lng: number): Promise<Forecast> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const hit = cache.get(key)
  if (hit) return hit
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,precipitation` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=America%2FEdmonton&forecast_days=7`
  const json = await fetch(url).then((r) => r.json())
  const forecast: Forecast = {
    temp: json.current.temperature_2m,
    code: json.current.weather_code,
    wind: json.current.wind_speed_10m,
    precip: json.current.precipitation,
    days: json.daily.time.map((date: string, i: number) => ({
      date,
      code: json.daily.weather_code[i],
      max: json.daily.temperature_2m_max[i],
      min: json.daily.temperature_2m_min[i],
      precip: json.daily.precipitation_sum[i],
    })),
  }
  cache.set(key, forecast)
  return forecast
}
