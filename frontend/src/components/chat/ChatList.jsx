import React from 'react';
import Avatar from '../ui/Avatar';
import Loader from '../ui/Loader';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';
import { getChatName, getChatAvatar, formatMessageTime, truncateText, isUserOnline } from '../../utils/helpers';

const ChatList = ({ chats, loading }) => {
  const user = useAuthStore((state) => state.user);
  const { selectedChat, setSelectedChat, onlineUsers } = useChatStore();

  if (loading) {
    return <Loader />;
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-secondary text-center text-sm">
          No chats yet. Start a new conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {chats.map((chat) => {
        const chatName = getChatName(chat, user);
        const chatAvatar = getChatAvatar(chat, user);
        const otherUser = chat.users.find((u) => u._id !== user._id);
        const online = otherUser && isUserOnline(otherUser._id, onlineUsers);
        const isSelected = selectedChat?._id === chat._id;

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedChat(chat)}
            className={`
              flex items-center gap-3 p-3 px-4 cursor-pointer transition-colors border-b border-default
              ${isSelected ? 'bg-muted' : 'hover-surface'}
            `}
          >
            <Avatar
              src={chatAvatar}
              alt={chatName}
              size="lg"
              online={!chat.isGroupChat && online}
            />

            <div className="flex-1 min-w-0">
              {/* Header row: Name on left, time + badge on right */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-primary truncate">
                  {chatName}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {chat.latestMessage && (
                    <span className="text-[11px] text-secondary">
                      {formatMessageTime(chat.latestMessage.createdAt)}
                    </span>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-semibold rounded-full w-5 h-5 leading-5 text-center flex items-center justify-center flex-shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Preview row */}
              <div className="flex items-center">
                <p className="text-sm text-secondary truncate">
                  {chat.latestMessage ? (
                    <>
                      {chat.latestMessage.sender._id === user._id && '✓ '}
                      {truncateText(chat.latestMessage.content || '📎 Attachment', 35)}
                    </>
                  ) : (
                    'Say hi'
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;

