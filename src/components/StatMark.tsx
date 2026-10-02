export type StatKind = 'distance' | 'climb' | 'time' | 'water' | 'heat' | 'hikes'

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Small stroke marks in the same weight as the route line. */
export function StatMark({ kind, size = 16, light = false }: { kind: StatKind; size?: number; light?: boolean }) {
  return (
    <svg className={light ? 'stat-mark light' : 'stat-mark'} width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      {kind === 'distance' && (
        <path {...common} d="M2.2 11.6c2.4-.4 3.2-4.6 5.4-4.6 1.5 0 2.1 2.3 3.5 2.3 1.1 0 1.7-1.5 2.7-1.6" />
      )}
      {kind === 'climb' && (
        <>
          <path {...common} d="M2 12.4 6 7.8l2.4 2.1L13.2 3.4" />
          <path {...common} d="M9.6 3.4h3.6V7" />
        </>
      )}
      {kind === 'time' && (
        <>
          <circle {...common} cx="8" cy="8.2" r="5" />
          <path {...common} d="M8 5.2v3.2l2.1 1.3" />
        </>
      )}
      {kind === 'water' && (
        <path {...common} d="M8 1.8C8 1.8 3.4 7 3.4 10a4.6 4.6 0 0 0 9.2 0C12.6 7 8 1.8 8 1.8z" />
      )}
      {kind === 'heat' && (
        <path {...common} d="M8 2.2c.3 2-1.3 2.8-1.3 4.4 0 .8.5 1.4 1.3 1.6-.3-1 .7-1.7 1.3-2.3.1 1.6 2.5 2.4 2.5 4.6A3.8 3.8 0 0 1 8 14.2a3.8 3.8 0 0 1-3.8-3.7C4.2 7.8 6.4 6.2 8 2.2z" />
      )}
      {kind === 'hikes' && (
        <>
          <path {...common} d="M3.2 12.6h3.4V7" />
          <path {...common} d="M8.4 12.6h3.4V5.4" />
        </>
      )}
    </svg>
  )
}

export function Fact({ kind, value, label }: { kind: StatKind; value: string; label: string }) {
  return (
    <div className="fact">
      <StatMark kind={kind} />
      <p className="fact-value num">{value}</p>
      <p className="fact-label">{label}</p>
    </div>
  )
}
