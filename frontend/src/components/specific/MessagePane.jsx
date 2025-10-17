import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { server } from '../../constants/config'

const MessageBubble = ({ me, text }) => (
  <div className={`max-w-[70%] w-fit rounded-2xl px-3 py-2 text-sm ${me ? 'ml-auto bg-indigo-600 text-white' : 'bg-[var(--card)] border border-[color:var(--border)]'}`}>
    {text}
  </div>
)

const MessagePane = ({ chatId }) => {
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const viewportRef = useRef(null)
  const { user } = useSelector((s) => s.auth)
  const myId = user?._id

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!chatId) return
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await axios.get(`${server}/api/v1/chat/message/${chatId}`, { withCredentials: true })
        if (!mounted) return
        setMessages((data?.items || []).map((m) => ({
          id: m._id,
          me: String(m.sender) === String(myId) || String(m.sender?._id) === String(myId),
          text: m.content || (m.attachments?.length ? '[Attachment]' : ''),
          at: m.createdAt,
        })))
        // scroll to bottom
        setTimeout(() => viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'auto' }), 0)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load messages')
        setMessages([])
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [chatId, myId])

  const send = () => {
    if (!draft.trim()) return
    // wire to backend socket next; for now, clear input
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <div className="h-full grid grid-rows-[1fr_auto]">
      <div ref={viewportRef} className="min-h-0 overflow-auto p-4 space-y-2">
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading messages…</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)]">No messages yet.</div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} me={m.me} text={m.text} />)
        )}
      </div>
      <div className="border-t border-[color:var(--border)] p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e)=>setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="Write a message"
            aria-label="Message input"
            className="flex-1 max-h-40 min-h-11 px-3 py-2 rounded-md border border-[color:var(--border)] bg-transparent resize-none"
          />
          <button onClick={send} disabled={!draft.trim()} className="h-11 px-4 rounded-md bg-[var(--primary)] text-white disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  )
}

export default MessagePane
