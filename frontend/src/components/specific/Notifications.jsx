import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import axios from 'axios'
import { server } from '../../constants/config'
import Modal from '../shared/Modal'
import { clearNotifications, setNotifications, setChats } from '../../redux/reducers/chat'
import toast from 'react-hot-toast'
import { useState } from 'react'

const Notifications = ({ onClose }) => {
  const dispatch = useDispatch()
  const { notifications = [] } = useSelector((s) => s.chat || {})
  const [actingId, setActingId] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const { data } = await axios.get(`${server}/api/v1/user/notifications`, { withCredentials: true })
        if (!mounted) return
        dispatch(setNotifications(data?.items || []))
      } catch (_) {
        dispatch(setNotifications([]))
      }
    }
    load()
    return () => { mounted = false }
  }, [dispatch])

  return (
    <Modal title="Notifications" onClose={onClose}>
      {notifications.length === 0 ? (
        <div className="text-sm text-[color:var(--muted)]">No notifications yet.</div>
      ) : (
        <div className="grid gap-2 max-h-[60vh] overflow-auto pr-1">
          {notifications.map((n, idx) => {
            const sender = n?.sender || {}
            return (
              <div key={idx} className="rounded-lg border border-[color:var(--border)] p-3 bg-[var(--card)]">
                <div className="text-sm">
                  <span className="font-medium">{sender.name || 'Someone'}</span> (@{sender.username || 'user'}) sent you a friend request.
                </div>
                {n.createdAt ? (
                  <div className="mt-1 text-xs text-[color:var(--muted)]">{new Date(n.createdAt).toLocaleString()}</div>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    disabled={actingId === n._id}
                    onClick={async () => {
                      try {
                        setActingId(n._id)
                        await axios.put(
                          `${server}/api/v1/user/acceptrequest`,
                          { requestId: n._id, accept: true },
                          { withCredentials: true }
                        )
                        toast.success('Request accepted')
                        // refresh chats and remove this notification
                        const { data } = await axios.get(`${server}/api/v1/chat/my`, { withCredentials: true })
                        dispatch(setChats(data?.items || []))
                        dispatch(setNotifications(notifications.filter((x) => x._id !== n._id)))
                      } catch (e) {
                        toast.error(e?.response?.data?.message || 'Failed to accept')
                      } finally {
                        setActingId('')
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-white text-xs disabled:opacity-50"
                  >
                    {actingId === n._id ? 'Working…' : 'Add'}
                  </button>
                  <button
                    disabled={actingId === n._id}
                    onClick={async () => {
                      try {
                        setActingId(n._id)
                        await axios.put(
                          `${server}/api/v1/user/acceptrequest`,
                          { requestId: n._id, accept: false },
                          { withCredentials: true }
                        )
                        toast.success('Request blocked')
                        dispatch(setNotifications(notifications.filter((x) => x._id !== n._id)))
                      } catch (e) {
                        toast.error(e?.response?.data?.message || 'Failed to block')
                      } finally {
                        setActingId('')
                      }
                    }}
                    className="px-3 py-1.5 rounded-md border border-[color:var(--border)] text-xs disabled:opacity-50"
                  >
                    {actingId === n._id ? 'Working…' : 'Block'}
                  </button>
                </div>
              </div>
            )
          })}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => dispatch(clearNotifications())}
              className="px-3 py-2 rounded-md border border-[color:var(--border)] text-sm"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default Notifications
