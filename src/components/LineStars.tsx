/** One contour stroke. Five of them are a line rating. */
export function LineStar({ on, size = 18 }: { on: boolean; size?: number }) {
  const width = Math.max(8, Math.round(size * 0.42))
  return (
    <svg width={width} height={size} viewBox="0 0 8 18" aria-hidden>
      <rect
        x="2.4"
        y="1.2"
        width="3.2"
        height="15.6"
        rx="1.6"
        transform="rotate(18 4 9)"
        fill={on ? 'var(--glacier)' : 'rgba(10, 138, 130, 0.22)'}
      />
    </svg>
  )
}

/** The line rating: five contour strokes, filled to the nearest mark. */
export function LineStars({ value, size = 18 }: { value: number; size?: number }) {
  const filled = Math.round(value)
  return (
    <span className="line-stars" style={{ color: 'var(--glacier)' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <LineStar key={n} on={n <= filled} size={size} />
      ))}
    </span>
  )
}

export function lineRatingLabel(avg: number, count: number) {
  if (!count) return 'no trail rating yet'
  return `${avg.toFixed(1)} trail rating`
}
