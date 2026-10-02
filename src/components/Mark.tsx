/** The Switchback lockup: a hairpin, then the name. */
export function Mark({ tone = 'ink' }: { tone?: 'ink' | 'flour' }) {
  const c = tone === 'ink' ? '#0f201e' : '#e4eeeb'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: c }}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <path
          d="M4 5h11.5a4.5 4.5 0 0 1 0 9H9a4 4 0 0 0 0 8H22"
          fill="none"
          stroke={c}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em', lineHeight: 1 }}>
        Switchback
      </span>
    </span>
  )
}
