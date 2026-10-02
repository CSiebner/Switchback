import type { ReactNode } from 'react'

interface Props {
  peek: ReactNode
  list: ReactNode
}

/** One sheet. The chosen hike is first. Scroll to the other hikes that match the filters. */
export function ExploreSheet({ peek, list }: Props) {
  return (
    <section className="sheet ex-sheet">
      <div className="ex-scroll">
        {peek}
        <div className="ex-more">{list}</div>
      </div>
    </section>
  )
}
