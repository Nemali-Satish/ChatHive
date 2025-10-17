import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { server } from '../../constants/config'
import UserItem from '../shared/UserItem'
import Modal from '../shared/Modal'
import toast from 'react-hot-toast'

const Search = ({ onClose }) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const debounceRef = useRef(null)
  const { user } = useSelector((s) => s.auth)
  const myId = user?._id
  const [sendingId, setSendingId] = useState('')
  const [sentIds, setSentIds] = useState(new Set())

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${server}/api/v1/user/search`, {
          params: { q: query.trim() },
          withCredentials: true,
        })
        const items = data?.items || []
        // Exclude current user from results
        setUsers(items.filter((u) => String(u._id) !== String(myId)))
      } catch (_) {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, myId])

  const addFriend = async (user) => {
    try {
      if (String(user._id) === String(myId)) return
      setSendingId(user._id)
      await axios.put(
        `${server}/api/v1/user/sendrequest`,
        { userId: user._id },
        { withCredentials: true }
      )
      toast.success('Friend request sent')
      setSentIds((prev) => new Set(prev).add(user._id))
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to send request'
      toast.error(msg)
    } finally {
      setSendingId('')
    }
  }

  const content = useMemo(() => {
    if (loading) return <div className="text-sm text-[color:var(--muted)]">Searching…</div>
    if (!query.trim()) return <div className="text-sm text-[color:var(--muted)]">Type a name or username to search.</div>
    if (users.length === 0) return <div className="text-sm text-[color:var(--muted)]">No users found.</div>
    return (
      <div className="mt-3 grid gap-2 max-h-[60vh] overflow-auto pr-1">
        {users.map((u) => (
          <UserItem key={u._id} user={u} onAdd={addFriend} loading={sendingId === u._id} sent={sentIds.has(u._id)} />
        ))}
      </div>
    )
  }, [loading, query, users])

  return (
    <Modal title="Find people" onClose={onClose}>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or username"
        className="w-full h-10 px-3 rounded-md border border-[color:var(--border)] bg-transparent"
      />
      <div className="mt-2">{content}</div>
    </Modal>
  )
}

export default Search

