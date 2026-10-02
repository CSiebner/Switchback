export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function formatDelta(sec: number): string {
  const sign = sec <= 0 ? '−' : '+'
  return `${sign}${formatTime(Math.abs(sec))}`
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatGain(m: number): string {
  return `${Math.round(m)} m`
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 14) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export function conditionConfidence(timestamp: number, confirms: number): number {
  const hours = (Date.now() - timestamp) / 3600000
  const lambda = 0.0144
  const base = Math.exp(-lambda * hours)
  const boost = confirms * 0.08
  return Math.min(1, base + boost)
}

export function difficultyColor(d: string): string {
  if (d === 'Easy') return '#1f8a5b'
  if (d === 'Moderate') return '#c4841d'
  return '#c23b3b'
}
