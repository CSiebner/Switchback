const STAR = 'M12 3.2 14.7 9l6.3.6-4.8 4.1 1.5 6.1L12 16.8 6.3 19.8 7.8 13.7 3 9.6 9.3 9z'

export function LineStar({ on, size = 18 }: { on: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d={STAR}
        fill={on ? 'var(--larch)' : 'none'}
        stroke="var(--larch)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The line rating: five gold stars, filled to the nearest mark. */
export function LineStars({ value, size = 18 }: { value: number; size?: number }) {
  const filled = Math.round(value)
  return (
    <span className="line-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <LineStar key={n} on={n <= filled} size={size} />
      ))}
    </span>
  )
}

export function lineRatingLabel(avg: number, count: number) {
  if (!count) return 'no line rating yet'
  return `${avg.toFixed(1)} line rating`
}
