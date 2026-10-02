import { photosFor } from '../data/photos'

/** Real trail photography, credited. Horizontal, so it never blows the page width. */
export function PhotoRail({ trailId, tall = false }: { trailId: string; tall?: boolean }) {
  const photos = photosFor(trailId)
  if (photos.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{ flex: tall ? '0 0 78%' : '0 0 64%', minWidth: 0 }}
        >
          <img
            src={p.thumb}
            alt={p.caption ?? ''}
            style={{
              width: '100%',
              height: tall ? 210 : 148,
              objectFit: 'cover',
              borderRadius: 16,
              display: 'block',
              background: 'var(--rock-flour-2)',
            }}
          />
          <span className="survey" style={{ display: 'block', marginTop: 6 }}>
            {p.author} · {p.license}
          </span>
        </a>
      ))}
    </div>
  )
}
