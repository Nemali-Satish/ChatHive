import AppLayout from '../components/layout/AppLayout'
import ChatList from '../components/specific/ChatList'
import MessagePane from '../components/specific/MessagePane'
import { useParams } from 'react-router-dom'

const Chat = () => {
  const { chatId } = useParams()
  return (
    <AppLayout sidebar={<ChatList />}>
      <div className="h-[calc(100vh-64px-0px)] min-h-0">
        <MessagePane chatId={chatId} />
      </div>
    </AppLayout>
  )
}

export default Chat
