import React, { useEffect, useState, useRef } from 'react';
import { MoreVertical, Phone, Video, Info, ArrowLeft, Trash2, Eraser, Ban, Unlock, Bell, BellOff, LogOut } from 'lucide-react';
import Avatar from '../ui/Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import { getChatName, getChatAvatar, getOtherUser, isUserOnline } from '../../utils/helpers';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';
import { getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../config/constants';
import { useConfirmModal } from '../../context/ConfirmProvider';

const ChatWindow = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { selectedChat, setSelectedChat, messages, setMessages, onlineUsers, setInfoPanelOpen } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [otherInfo, setOtherInfo] = useState(null);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [optimisticBlocked, setOptimisticBlocked] = useState(null); // null = derive from store
  const socket = getSocket();
  const confirmModal = useConfirmModal();

  // Compute derived identities early so any effects can safely reference them
  const chatName = selectedChat ? getChatName(selectedChat, user) : '';
  const chatAvatar = selectedChat ? getChatAvatar(selectedChat, user) : undefined;
  const otherUser = selectedChat ? getOtherUser(selectedChat, user._id) : null;
  const online = otherUser && isUserOnline(otherUser._id, onlineUsers);
  const derivedBlocked = !!(selectedChat && !selectedChat.isGroupChat && otherUser && (user?.blockedUsers || []).some((id) => id === otherUser._id || id?._id === otherUser._id));
  const isBlocked = optimisticBlocked === null ? derivedBlocked : optimisticBlocked;
  const cannotMessage = !selectedChat?.isGroupChat && (isBlocked || blockedByOther);

  useEffect(() => {
    if (selectedChat) {
      // Clear previous messages when switching chats
      setMessages([]);
      fetchMessages();
      // Notify via socket that I have viewed this chat
      try {
        const s = socket;
        if (s && selectedChat?._id && user?._id) {
          s.emit(SOCKET_EVENTS.MESSAGE_READ, { chatId: selectedChat._id, userId: user._id });
        }
      } catch {}
    }
  }, [selectedChat?._id]); // Only re-run when chat ID changes

  // Refresh current user snapshot so blockedUsers is always up to date on chat change
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.GET_ME);
        if (data.success) updateUser(data.data);
      } catch { }
    })();
  }, [selectedChat?._id]);

  // Fetch other user's info to know if they blocked me
  useEffect(() => {
    (async () => {
      try {
        if (selectedChat && !selectedChat.isGroupChat) {
          const other = getOtherUser(selectedChat, user?._id);
          if (other?._id) {
            const res = await api.get(API_ENDPOINTS.GET_USER(other._id));
            if (res.data?.success) {
              setOtherInfo(res.data.data);
              const theirBlocked = (res.data.data?.blockedUsers || []).some((id) => (id?._id || id) === user?._id);
              setBlockedByOther(!!theirBlocked);
            }
          }
        } else {
          setOtherInfo(null);
          setBlockedByOther(false);
        }
      } catch {
        setOtherInfo(null);
        setBlockedByOther(false);
      }
    })();
  }, [selectedChat?._id, user?._id]);

  // Real-time: reflect when other user blocks/unblocks me
  useEffect(() => {
    if (!socket) return;
    const onUserBlocked = ({ by }) => {
      if (otherUser && by === otherUser._id) {
        setBlockedByOther(true);
      }
    };
    const onUserUnblocked = ({ by }) => {
      if (otherUser && by === otherUser._id) {
        setBlockedByOther(false);
      }
    };
    socket.on(SOCKET_EVENTS.USER_BLOCKED, onUserBlocked);
    socket.on(SOCKET_EVENTS.USER_UNBLOCKED, onUserUnblocked);
    return () => {
      socket.off(SOCKET_EVENTS.USER_BLOCKED, onUserBlocked);
      socket.off(SOCKET_EVENTS.USER_UNBLOCKED, onUserUnblocked);
    };
  }, [socket, otherUser?._id]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    setLoading(true);
    try {
      const { data } = await api.get(API_ENDPOINTS.GET_MESSAGES(selectedChat._id));
      if (data.success) {
        setMessages(data.data || []);
        // After messages load, signal read again to be safe
        try {
          if (socket && selectedChat?._id && user?._id) {
            socket.emit(SOCKET_EVENTS.MESSAGE_READ, { chatId: selectedChat._id, userId: user._id });
          }
        } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to fetch messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep hook order consistent across renders (no-op placeholder)
  useEffect(() => { }, [selectedChat?._id, otherUser?._id, user?.blockedUsers?.length]);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Info className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">
            Welcome to ChatHive
          </h3>
          <p className="text-secondary">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setSelectedChat(null);
  };

  const confirmClearChat = () => {
    confirmModal({
      title: 'Clear chat?',
      description: 'This removes messages from your view. Others remain unaffected.',
      variant: 'danger',
      confirmLabel: 'Clear',
      onConfirm: async () => {
        await api.delete(API_ENDPOINTS.CLEAR_CHAT(selectedChat._id));
        setMessages([]);
        window.dispatchEvent(new Event('refresh-chats'));
        toast.success('Chat cleared');
        setMenuOpen(false);
      },
    });
  };

  const confirmDeleteChat = () => {
    confirmModal({
      title: 'Delete chat?',
      description: 'This removes the chat from your list. It will not affect the other user.',
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await api.delete(API_ENDPOINTS.DELETE_CHAT(selectedChat._id));
        window.dispatchEvent(new Event('refresh-chats'));
        setSelectedChat(null);
        toast.success('Chat deleted');
        setMenuOpen(false);
      },
    });
  };

  const handleToggleBlock = async () => {
    if (!otherUser) return;
    const blocking = !isBlocked;
    confirmModal({
      title: blocking ? `Block ${otherUser?.name || otherUser?.email || 'this user'}?` : `Unblock ${otherUser?.name || otherUser?.email || 'this user'}?`,
      description: blocking
        ? 'They will not be able to message you until you unblock them.'
        : 'You will be able to exchange messages again.',
      variant: blocking ? 'danger' : 'primary',
      confirmLabel: blocking ? 'Block' : 'Unblock',
      onConfirm: async () => {
        try {
          // Optimistic update
          setOptimisticBlocked(blocking);
          if (isBlocked) {
            await api.delete(API_ENDPOINTS.UNBLOCK_USER(otherUser._id));
            toast.success('User unblocked');
            const next = (user?.blockedUsers || []).filter((id) => (id?._id || id) !== otherUser._id);
            updateUser({ blockedUsers: next });
          } else {
            await api.post(API_ENDPOINTS.BLOCK_USER(otherUser._id));
            toast.success('User blocked');
            const next = [...(user?.blockedUsers || []), otherUser._id];
            updateUser({ blockedUsers: next });
          }
          window.dispatchEvent(new Event('refresh-chats'));
          // Reconcile with server
          try {
            const { data } = await api.get(API_ENDPOINTS.GET_ME);
            if (data.success) {
              updateUser(data.data);
              setOptimisticBlocked(null);
            }
          } catch { setOptimisticBlocked(null); }
          setMenuOpen(false);
        } catch (e) {
          toast.error(e.response?.data?.message || 'Failed to update block status');
          setOptimisticBlocked(null);
          throw e; // keep modal open and show error text
        }
      }
    });
  };

  // Group actions
  const handleToggleMuteGroup = async () => {
    if (!selectedChat?.isGroupChat) return;
    try {
      const muted = Array.isArray(selectedChat.mutedBy) && selectedChat.mutedBy.some((id) => (id?._id || id) === user._id);
      await api.put(API_ENDPOINTS.GROUP_MUTE, { chatId: selectedChat._id, mute: !muted });
      const nextMutedBy = muted
        ? (selectedChat.mutedBy || []).filter((id) => (id?._id || id) !== user._id)
        : [ ...(selectedChat.mutedBy || []), user._id ];
      useChatStore.getState().setSelectedChat({ ...selectedChat, mutedBy: nextMutedBy });
      window.dispatchEvent(new Event('refresh-chats'));
      toast.success(muted ? 'Unmuted group' : 'Muted group');
      setMenuOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update mute');
    }
  };

  const confirmLeaveGroup = () => {
    if (!selectedChat?.isGroupChat) return;
    confirmModal({
      title: 'Exit group?',
      description: 'You will stop receiving messages from this group until re-added.',
      variant: 'danger',
      confirmLabel: 'Exit',
      onConfirm: async () => {
        await api.put(API_ENDPOINTS.GROUP_LEAVE, { chatId: selectedChat._id });
        window.dispatchEvent(new Event('refresh-chats'));
        setSelectedChat(null);
        toast.success('Exited group');
        setMenuOpen(false);
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-app">
      <div className="px-4 py-2.5 bg-header shadow-sm border-b border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back button for mobile */}
            <button
              onClick={handleBack}
              aria-label="Back"
              className="md:hidden p-2 rounded-full hover-surface transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-secondary" />
            </button>

            <button
              onClick={() => setInfoPanelOpen(true)}
              className="flex items-center gap-3 flex-1 min-w-0 rounded-lg hover-surface text-left"
              aria-label={selectedChat.isGroupChat ? 'Open group info' : 'Open chat info'}
            >
              <Avatar
                src={chatAvatar}
                alt={chatName}
                size="md"
                online={!selectedChat.isGroupChat && online}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-primary truncate text-base">{chatName}</h2>
                {!selectedChat.isGroupChat && otherUser && (
                  <p className="text-xs text-secondary truncate">
                    {online ? 'online' : 'offline'}
                  </p>
                )}
                {selectedChat.isGroupChat && (
                  <p className="text-xs text-secondary truncate">
                    {selectedChat.users.map(u => u.name).join(', ')}
                  </p>
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-full hover-surface transition-colors">
              <MoreVertical className="w-5 h-5 text-secondary" />
            </button>
            {menuOpen && (
              <div className="absolute right-4 top-12 z-20 w-48 bg-panel border border-default rounded-lg shadow-xl py-1 transform origin-top-right transition-all duration-150 ease-out scale-100 opacity-100">
                <button onClick={confirmClearChat} className="w-full px-4 py-2 text-left text-sm hover-surface flex items-center gap-2 text-primary">
                  <Eraser className="w-4 h-4" />
                  Clear chat
                </button>
                <button onClick={confirmDeleteChat} className="w-full px-4 py-2 text-left text-sm hover-surface flex items-center gap-2" style={{ color: '#ef4444' }}>
                  <Trash2 className="w-4 h-4" />
                  Delete chat
                </button>
                {!selectedChat.isGroupChat && (
                  <button onClick={handleToggleBlock} className="w-full px-4 py-2 text-left text-sm hover-surface flex items-center gap-2 text-primary">
                    {isBlocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    {isBlocked ? 'Unblock user' : 'Block user'}
                  </button>
                )}
                {selectedChat.isGroupChat && (
                  <>
                    <button onClick={handleToggleMuteGroup} className="w-full px-4 py-2 text-left text-sm hover-surface flex items-center gap-2 text-primary">
                      {(Array.isArray(selectedChat.mutedBy) && selectedChat.mutedBy.some((id) => (id?._id || id) === user._id)) ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                      {(Array.isArray(selectedChat.mutedBy) && selectedChat.mutedBy.some((id) => (id?._id || id) === user._id)) ? 'Unmute group' : 'Mute group'}
                    </button>
                    <button onClick={confirmLeaveGroup} className="w-full px-4 py-2 text-left text-sm hover-surface flex items-center gap-2" style={{ color: '#ef4444' }}>
                      <LogOut className="w-4 h-4" />
                      Exit group
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} loading={loading} />

      {/* Input or Blocked Actions */}
      {!selectedChat.isGroupChat && cannotMessage ? (
        <div className="bg-panel backdrop-blur border-t border-default rounded-t-2xl">
          {/* Banner */}
          <div className="px-5 pt-4">
            <div className="mx-auto max-w-2xl flex justify-center">
              <div className="text-center text-[13px] leading-5 text-secondary bg-header px-3 py-1.5 rounded-full shadow-sm">
                {isBlocked
                  ? 'You blocked this contact. Unblock to resume messaging.'
                  : 'You cannot send messages to this contact because you are blocked.'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-4 pt-3">
            <div className="mx-auto max-w-2xl grid grid-cols-2  gap-4 sm:gap-8">
              <button
                onClick={confirmDeleteChat}
                className="group inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover-surface"
                style={{ color: '#ef4444' }}
                aria-label="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete chat</span>
              </button>

              {isBlocked ? (
                <button
                  onClick={handleToggleBlock}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover-surface"
                  style={{ color: '#16a34a' }}
                  aria-label="Unblock user"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unblock</span>
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      ) : (
        <MessageInput />
      )}
    </div>
  );
};

export default ChatWindow;
