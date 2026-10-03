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
  const [open, setOpen] = useState(false)
  const loved = kudos.includes(CURRENT_USER_ID)
  return (
    <div className="talk">
      <button type="button" className={`kudo ${loved ? 'loved' : ''}`} aria-pressed={loved} aria-label="React" onClick={onKudo}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path fill="currentColor" d="M8 13.4 2.7 8.4C1.4 7.2 1.5 5.1 3 4a2.7 2.7 0 0 1 3.5.4L8 6.1l1.5-1.7A2.7 2.7 0 0 1 13 4c1.5 1.1 1.6 3.2.3 4.4L8 13.4z" />
        </svg>
        {kudos.length > 0 && <span className="num">{kudos.length}</span>}
      </button>
      {comments.map((c) => (
        <p key={c.id} className="talk-line">
          <strong>{c.userId === CURRENT_USER_ID ? 'You' : getHiker(c.userId)?.name ?? 'Hiker'}</strong> {c.text}
        </p>
      ))}
      {open ? (
        <form
          className="talk-form"
          onSubmit={(e) => {
            e.preventDefault()
            const next = text.trim()
            if (!next) return
            onComment(next)
            setText('')
            setOpen(false)
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus />
          <button className="chip" type="button" onClick={() => setOpen(false)}>Cancel</button>
          <button className="chip active" type="submit">Send</button>
        </form>
      ) : (
        <button type="button" className="chip" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
          Comment
        </button>
      )}
    </div>
  )
}
