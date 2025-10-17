import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { useSocket } from '../socket'
import { server } from '../constants/config'
import { setChats, addNotification } from '../redux/reducers/chat'

// Backend socket events
const REFETCH_CHATS = 'REFETCH_CHATS'
const NEW_MESSAGE_ALERT = 'NEW_MESSAGE_ALERT'

const SocketEffects = () => {
  const socket = useSocket()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!socket) return

    // Ensure the socket is connected once user is inside protected area
    if (!socket.connected) socket.connect()

    const onRefetch = async () => {
      try {
        const { data } = await axios.get(`${server}/api/v1/chat/my`, { withCredentials: true })
        dispatch(setChats(data?.items || []))
      } catch (_) {
        // silent fail; UI will refresh on next navigation
      }
    }

    const onNewMessageAlert = ({ chatId }) => {
      dispatch(addNotification({ type: 'message', chatId, message: 'New message' }))
    }

    socket.on(REFETCH_CHATS, onRefetch)
    socket.on(NEW_MESSAGE_ALERT, onNewMessageAlert)

    return () => {
      socket.off(REFETCH_CHATS, onRefetch)
      socket.off(NEW_MESSAGE_ALERT, onNewMessageAlert)
    }
  }, [socket, dispatch])

  // This component renders nothing; it only sets up listeners
  return null
}

export default SocketEffects
