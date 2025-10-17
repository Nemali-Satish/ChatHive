import { useState } from 'react'
import Modal from '../shared/Modal'
import axios from 'axios'
import { server } from '../../constants/config'
import { useDispatch } from 'react-redux'
import { setChats } from '../../redux/reducers/chat'
import toast from 'react-hot-toast'

const NewGroup = ({ onClose }) => {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dispatch = useDispatch()

  const createGroup = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await axios.post(
        `${server}/api/v1/chat/new`,
        { name: name.trim(), members: [] },
        { withCredentials: true }
      )
      // refresh chats list
      const { data } = await axios.get(`${server}/api/v1/chat/my`, { withCredentials: true })
      dispatch(setChats(data?.items || []))
      toast.success('Group created')
      onClose?.()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Create a group" onClose={onClose}>
      <label className="block">
        <span className="text-sm">Group name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team Alpha"
          className="mt-1 w-full h-10 px-3 rounded-md border border-[color:var(--border)] bg-transparent"
        />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-2 rounded-md border border-[color:var(--border)]">Cancel</button>
        <button onClick={createGroup} disabled={!name.trim() || submitting} className="px-3 py-2 rounded-md bg-[var(--primary)] text-white disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </Modal>
  )
}

export default NewGroup
