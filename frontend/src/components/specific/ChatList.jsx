import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { setActiveChat, setChats } from '../../redux/reducers/chat'
import axios from 'axios'
import { server } from '../../constants/config'
import toast from 'react-hot-toast'

const ChatRow = ({ chat, active }) => (
  <Link
    to={`/chat/${chat._id}`}
    className={`block px-3 py-2 rounded-md border ${active ? 'border-[color:var(--text)]' : 'border-[color:var(--border)] hover:border-[color:var(--text)]'}`}
  >
    <div className="text-sm font-medium truncate">{chat.name || 'Conversation'}</div>
    {chat.lastMessage ? (
      <div className="text-xs text-[color:var(--muted)] truncate">{chat.lastMessage}</div>
    ) : null}
  </Link>
)

const ChatList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { chats = [], activeChatId } = useSelector((s) => s.chat)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If an active chat is set ensure route reflects it
    if (activeChatId) navigate(`/chat/${activeChatId}`, { replace: false })
  }, [activeChatId, navigate])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${server}/api/v1/chat/my`, { withCredentials: true })
        if (!mounted) return
        dispatch(setChats(data?.items || []))
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load chats')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [dispatch])

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Conversations</h3>
        <Link to="/groups" className="text-xs underline">New group</Link>
      </div>
      <div className="grid gap-2">
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading chats…</div>
        ) : chats.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)]">No conversations yet.</div>
        ) : (
          chats.map((c) => (
            <div key={c._id} onClick={() => dispatch(setActiveChat(c._id))}>
              <ChatRow chat={c} active={activeChatId === c._id} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatList
