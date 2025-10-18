import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import Avatar from '../ui/Avatar';
import Loader from '../ui/Loader';
import Button from '../ui/Button';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';
import { groupMessagesByDate, getOtherUser } from '../../utils/helpers';
import { Check, CheckCheck, UserPlus, Ban } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';

const MessageList = ({ messages, loading }) => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { selectedChat } = useChatStore();
  const messagesEndRef = useRef(null);
  const [showUnknownBanner, setShowUnknownBanner] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch current user data to check friends/blocked status
    const fetchCurrentUser = async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.GET_USER(user._id));
        if (data.success) {
          setCurrentUser(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data');
      }
    };
    fetchCurrentUser();
    // Reset banner when chat changes
    setShowUnknownBanner(true);
  }, [user._id, selectedChat?._id]);

  // Check if the other user is in contacts (has existing chat)
  const otherUser = selectedChat && !selectedChat.isGroupChat ? getOtherUser(selectedChat, user._id) : null;

  // Check if user is already a friend or blocked
  const isFriend = currentUser?.friends?.some(f => f._id === otherUser?._id);
  const isBlocked = currentUser?.blockedUsers?.some(b => b._id === otherUser?._id);

  // Only show banner if user is not a friend and not blocked
  const isUnknownUser = otherUser && messages.length > 0 && !isFriend && !isBlocked;

  const handleAddFriend = async () => {
    if (!otherUser) return;
    setActionLoading(true);
    try {
      const { data } = await api.post(API_ENDPOINTS.ADD_FRIEND(otherUser._id));
      if (data.success) {
        toast.success('Friend added successfully');
        setShowUnknownBanner(false);
        // Refresh user data to update friends list
        const userData = await api.get(API_ENDPOINTS.GET_USER(user._id));
        if (userData.data.success) {
          setCurrentUser(userData.data.data);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!otherUser) return;
    setActionLoading(true);
    try {
      const { data } = await api.post(API_ENDPOINTS.BLOCK_USER(otherUser._id));
      if (data.success) {
        toast.success('User blocked successfully');
        setShowUnknownBanner(false);
        // Optimistically update global auth store so ChatWindow reflects immediately
        const next = [...(user?.blockedUsers || []), otherUser._id];
        updateUser({ blockedUsers: next });
        // Notify Sidebar to refresh lists
        window.dispatchEvent(new Event('refresh-chats'));
        // Refresh user data to update blocked list
        const userData = await api.get(API_ENDPOINTS.GET_USER(user._id));
        if (userData.data.success) {
          setCurrentUser(userData.data.data);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-secondary">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 bg-app relative">
      {/* Floating Unknown User Banner - Below Header */}
      {isUnknownUser && showUnknownBanner && (
        <div className="sticky top-0 z-10 mb-4">
          <div className="bg-panel rounded-2xl p-4 shadow-2xl animate-slide-down" style={{ border: '2px solid var(--accent)' }}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Avatar src={otherUser.avatar?.url} alt={otherUser.name} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-primary mb-1">
                  Message from {otherUser.name}
                </h4>
                <p className="text-sm text-secondary mb-3">
                  This person is not in your contacts. Would you like to add them or block them?
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={handleAddFriend}
                    loading={actionLoading}
                    icon={UserPlus}
                  >
                    Add Friend
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleBlock}
                    loading={actionLoading}
                    icon={Ban}
                  >
                    Block
                  </Button>
                  <button
                    onClick={() => setShowUnknownBanner(false)}
                    className="px-3 py-1.5 text-sm text-secondary hover:opacity-80 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-panel px-4 py-1 rounded-full shadow-sm">
              <p className="text-xs text-secondary font-medium">{date}</p>
            </div>
          </div>

          {/* Messages */}
          {msgs.map((message, index) => {
            const isOwn = message.sender._id === user._id;
            const showAvatar = !isOwn && (
              index === msgs.length - 1 ||
              msgs[index + 1]?.sender._id !== message.sender._id
            );
            const otherUser = selectedChat && !selectedChat.isGroupChat ? getOtherUser(selectedChat, user._id) : null;
            const otherId = otherUser?._id;
            const readByIds = (message.readBy || []).map((id) => (id?._id || id)?.toString());
            const readByOther = isOwn && otherId ? readByIds.includes(otherId.toString()) : false;

            return (
              <div
                key={message._id}
                className={`flex items-end gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {showAvatar && !isOwn ? (
                  <Avatar
                    src={message.sender.avatar?.url}
                    alt={message.sender.name}
                    size="sm"
                  />
                ) : (
                  !isOwn && <div className="w-8" />
                )}

                {/* Message Bubble */}
                <div
                  className={`
                    max-w-[85%] sm:max-w-[70%] min-w-[140px] px-3 pt-1 pb-1 rounded-lg break-words shadow-md
                    ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}
                  `}
                  style={isOwn ? { background: 'var(--accent)', color: 'var(--accent-contrast)' } : { background: 'var(--bg-header)', color: 'var(--text-primary)' }}
                >
                  {/* Sender Name (for group chats) */}
                  {!isOwn && message.chat?.isGroupChat && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      {message.sender.name}
                    </p>
                  )}

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx} className="mb-2">
                          {attachment.type === 'image' && (
                            <img
                              src={attachment.url}
                              alt="attachment"
                              className="rounded-lg max-w-full h-auto"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  {message.content && (
                    <p className="text-sm break-words">{message.content}</p>
                  )}

                  {/* Time and Status footer inside bubble */}
                  <div className="flex items-center gap-0.5 justify-end whitespace-nowrap">
                    <span className="text-[10px] leading-none" style={{ color: isOwn ? 'rgba(255,255,255,0.8)' : '#cbd5e1' }}>
                      {format(new Date(message.createdAt), 'h:mm a')}
                    </span>
                    {isOwn && (
                      readByOther ? (
                        <CheckCheck className="w-3 h-3" style={{ color: '#53bdeb' }} />
                      ) : (
                        <CheckCheck className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
