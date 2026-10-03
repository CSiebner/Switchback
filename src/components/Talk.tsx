import { useState } from 'react'
import { getHiker, type Comment } from '../data/seed'
import { CURRENT_USER_ID } from '../data/seed'

/** One reaction and a single layer of comments. No thread inside the thread. */
export function Talk({
  kudos = [],
  comments = [],
  onKudo,
  onComment,
  placeholder = 'Add a note',
}: {
  kudos?: string[]
  comments?: Comment[]
  onKudo: () => void
  onComment: (text: string) => void
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const loved = kudos.includes(CURRENT_USER_ID)
  return (
    <div className="talk">
      <button type="button" className={`kudo ${loved ? 'loved' : ''}`} aria-pressed={loved} onClick={onKudo}>
        <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <path d="M6 1 11 10H1z" />
        </svg>
        {kudos.length > 0 && <span className="num">{kudos.length}</span>}
      </button>
      {comments.map((c) => (
        <p key={c.id} className="talk-line">
          <strong>{c.userId === CURRENT_USER_ID ? 'You' : getHiker(c.userId)?.name ?? 'Hiker'}</strong> {c.text}
        </p>
      ))}
      <form
        className="talk-form"
        onSubmit={(e) => {
          e.preventDefault()
          const next = text.trim()
          if (!next) return
          onComment(next)
          setText('')
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
        <button className="chip active" type="submit">Send</button>
      </form>
    </div>
  )
}
