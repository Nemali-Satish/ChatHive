import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Settings, LogOut, MoreVertical, Users, Ban, Sun, Moon, Bell, Check, X } from 'lucide-react';
import ChatList from './ChatList';
import NewChatView from './NewChatView';
import Avatar from '../ui/Avatar';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';
// Network moved into stores
import { disconnectSocket } from '../../services/socket';
import toast from 'react-hot-toast';
import { initializeSocket, getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { formatLastSeen } from '../../utils/helpers';
import { useConfirmModal } from '../../context/ConfirmProvider';
import NotificationsModal from './NotificationsModal';

const Sidebar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logoutAsync = useAuthStore((state) => state.logoutAsync);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [invites, setInvites] = useState([]);
  const [pendingSent, setPendingSent] = useState([]); // server-side pending sent invites
  const [showInvites, setShowInvites] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const { selectedChat } = useChatStore();
  const fetchChatsAction = useChatStore((s) => s.fetchChats);
  const markChatRead = useChatStore((s) => s.markChatRead);
  const fetchUserDataAsync = useChatStore((s) => s.fetchUserDataAsync);
  const userRemoveFriendAsync = useChatStore((s) => s.userRemoveFriendAsync);
  const userUnblockAsync = useChatStore((s) => s.userUnblockAsync);
  const listPendingInvitesAsync = useChatStore((s) => s.listPendingInvitesAsync);
  const listPendingInvitesSentAsync = useChatStore((s) => s.listPendingInvitesSentAsync);
  const markInviteReadAsync = useChatStore((s) => s.markInviteReadAsync);
  const acceptInviteAsync = useChatStore((s) => s.acceptInviteAsync);
  const declineInviteAsync = useChatStore((s) => s.declineInviteAsync);
  const selectedChatIdRef = useRef(null);
  const confirmModal = useConfirmModal();
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?._id || null;
  }, [selectedChat?._id]);
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      const raw = localStorage.getItem('unreadCounts');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }); // { [chatId]: number }

  useEffect(() => {
    fetchChats(false);
    fetchInvites(true);
    fetchPendingSent(true);
  }, []);

  // Listen for global refresh event (e.g., after deleting a chat from ChatWindow)
  useEffect(() => {
    const handler = () => {
      fetchChats(true);
      fetchUserData();
      fetchInvites();
      fetchPendingSent(true);
    };
    window.addEventListener('refresh-chats', handler);
    return () => window.removeEventListener('refresh-chats', handler);
  }, []);

  // Socket: auto-refresh chat list on new incoming messages or connection
  useEffect(() => {
    const socket = initializeSocket();
    try {
      if (!socket.connected) socket.connect();
      // announce current user
      if (user) socket.emit(SOCKET_EVENTS.SETUP, user);

      const onConnected = () => {
        // fetch chats once connected (silent)
        fetchChats(true);
        fetchInvites(true);
      };
      const onMessageReceived = (msg) => {
        // Switch to main Chats tab and clear search so the new chat is visible
        setActiveTab('chats');
        setSearchQuery('');
        // Normalize payload fields (can be either objects or IDs)
        const chatId = msg?.chat?._id || msg?.chat;
        const senderId = msg?.sender?._id || msg?.sender;

      // Optimistically merge/insert chat with latest message if we have the chat object
      if (msg && msg.chat && typeof msg.chat === 'object') {
        setChats((prev) => {
          const exists = prev.some((c) => c._id === (msg.chat?._id));
          const updated = exists
            ? prev.map((c) => (c._id === msg.chat._id ? { ...msg.chat, latestMessage: msg } : c))
            : [{ ...msg.chat, latestMessage: msg }, ...prev];
          return updated;
        });
      } else {
        // If we only have ids, fallback to fetch full list so new chat appears
        fetchChats(true);
      }
      // Also refresh invites in case this message is a request-type notification
      fetchInvites(true);
      };
      const onMessageRead = ({ chatId, userId }) => {
        // If I read messages in a chat elsewhere, clear its unread counter
        if (userId === user?._id && chatId) {
          setUnreadCounts((prev) => {
            const key = String(chatId);
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      };
      const onGroupNotification = (payload) => {
        // Group invitations and membership changes should refresh invites/chats immediately
        fetchInvites(true);
        fetchChats(true);
      };
      const onGroupUpdated = (payload) => {
        fetchChats(true);
      };
      const onUserBlocked = ({ by }) => {
        // If current user got blocked by someone, refresh list (chat might be hidden or input disabled)
        fetchChats();
      };
      const onUserUnblocked = ({ by }) => {
        // Refresh to re-enable messaging state and possibly surface chat
        fetchChats();
      };
      socket.on(SOCKET_EVENTS.CONNECTED, onConnected);
      socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, onMessageReceived);
      socket.on(SOCKET_EVENTS.NEW_MESSAGE, onMessageReceived);
      socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
      socket.on(SOCKET_EVENTS.USER_BLOCKED, onUserBlocked);
      socket.on(SOCKET_EVENTS.USER_UNBLOCKED, onUserUnblocked);
      socket.on(SOCKET_EVENTS.INVITES_UPDATED, () => { setActiveTab('chats'); setSearchQuery(''); fetchInvites(true); fetchPendingSent(true); fetchChats(true); });
      socket.on(SOCKET_EVENTS.GROUP_NOTIFICATION, onGroupNotification);
      socket.on(SOCKET_EVENTS.GROUP_UPDATED, onGroupUpdated);

      return () => {
        socket.off(SOCKET_EVENTS.CONNECTED, onConnected);
        socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED, onMessageReceived);
        socket.off(SOCKET_EVENTS.NEW_MESSAGE, onMessageReceived);
        socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
        socket.off(SOCKET_EVENTS.USER_BLOCKED, onUserBlocked);
        socket.off(SOCKET_EVENTS.USER_UNBLOCKED, onUserUnblocked);
        socket.off(SOCKET_EVENTS.INVITES_UPDATED);
        socket.off(SOCKET_EVENTS.GROUP_NOTIFICATION, onGroupNotification);
        socket.off(SOCKET_EVENTS.GROUP_UPDATED, onGroupUpdated);
      };
    } catch (e) {
      console.error('Socket setup failed', e);
    }
  }, [user?._id]);

  // Periodically refresh invites and sent-pending so badge stays fresh
  useEffect(() => {
    const t = setInterval(() => { fetchInvites(true); fetchPendingSent(true); }, 30000);
    return () => clearInterval(t);
  }, []);

  // Clear unread count when opening a chat
  useEffect(() => {
    if (selectedChat?._id) {
      // Ensure the selected chat is present in the sidebar list even if it has no messages yet
      setChats((prev) => {
        const exists = prev.some((c) => c._id === selectedChat._id);
        if (exists) return prev;
        return [selectedChat, ...prev];
      });

      setUnreadCounts((prev) => {
        const key = String(selectedChat._id);
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      // Optionally mark as read on server
      try {
        markChatRead(selectedChat._id);
      } catch { }
    }
  }, [selectedChat?._id]);

  // Persist unread counts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
    } catch { }
  }, [unreadCounts]);

  // Refetch on window focus to surface any updates missed while tab was hidden
  useEffect(() => {
    const onFocus = () => fetchChats();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    // Always fetch user data when tab changes to ensure fresh data
    fetchUserData();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchChats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await fetchChatsAction();
      if (data?.success) {
        const serverChats = data.data || [];
        // If a chat is currently selected but not present in server list yet, keep it visible
        let merged = (() => {
          if (selectedChat && selectedChat._id && !serverChats.some((c) => c._id === selectedChat._id)) {
            return [selectedChat, ...serverChats];
          }
          return serverChats;
        })();
        // Include pending-sent placeholders
        merged = mergeChatsWithPending(merged, pendingSent, user?._id);
        setChats(merged);
      }
    } catch (error) {
      console.error('Failed to fetch chats');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUserData = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetchUserDataAsync(user._id);
      const data = res.data;
      if (data?.success) {
        setFriends(data.data.friends || []);
        setBlockedUsers(data.data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Failed to fetch user data');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchInvites = async (silent = false) => {
    try {
      const res = await listPendingInvitesAsync();
      if (res.data?.success) setInvites(res.data.data || []);
    } catch {}
  };

  const fetchPendingSent = async (silent = false) => {
    try {
      const res = await listPendingInvitesSentAsync();
      if (res.data?.success) setPendingSent(res.data.data || []);
    } catch {}
  };

  // When pendingSent changes, re-merge into chats for placeholder visibility
  useEffect(() => {
    setChats((prev) => mergeChatsWithPending(prev, pendingSent, user?._id));
  }, [pendingSent?.length]);

  const mergeChatsWithPending = (serverChats, pending, myId) => {
    const out = [...serverChats];
    const has = new Set(out.map((c) => String(c._id)));
    for (const inv of pending || []) {
      const other = inv?.to;
      if (!other?._id) continue;
      // try find any existing 1:1 chat with this user
      const exists = out.some((c) => !c.isGroupChat && (c.users || []).some(u => (u._id || u) === other._id));
      if (exists) continue;
      const placeholder = {
        _id: `invite-${inv._id}`,
        isGroupChat: false,
        users: [{ _id: myId }, other],
        latestMessage: null,
        pendingInvite: true,
        updatedAt: inv.createdAt,
      };
      out.unshift(placeholder);
    }
    return out;
  };

  const markAllInvitesRead = async () => {
    try {
      const unread = (invites || []).filter((i) => !i.read);
      await Promise.all(unread.map((i) => markInviteReadAsync(i._id)));
      setInvites((prev) => prev.map((i) => ({ ...i, read: true })));
    } catch {}
  };

  const onAcceptInvite = async (id) => {
    try {
      const { data } = await acceptInviteAsync(id);
      if (data?.success) {
        setInvites((prev) => prev.filter((i) => i._id !== id));
        toast.success('Invite accepted');
        fetchChats(true);
      }
    } catch {
      toast.error('Failed to accept invite');
    }
  };

  const onDeclineInvite = async (id) => {
    try {
      const { data } = await declineInviteAsync(id);
      if (data?.success) {
        setInvites((prev) => prev.filter((i) => i._id !== id));
        toast.success('Invite declined');
      }
    } catch {
      toast.error('Failed to decline invite');
    }
  };

  const handleRemoveFriend = async (userId) => {
    const friend = friends.find(f => f._id === userId);
    const label = friend?.name || friend?.email || 'this user';
    confirmModal({
      action: 'friend.remove',
      title: `Remove ${label}?`,
      description: `You will remove ${label} from your friends.`,
      variant: 'danger',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        const { data } = await userRemoveFriendAsync(userId);
        if (data.success) {
          setFriends(friends.filter(f => f._id !== userId));
          toast.success('Friend removed');
        }
      },
      meta: { userId }
    });
  };

  const handleUnblock = async (userId) => {
    const userObj = blockedUsers.find(u => u._id === userId);
    const label = userObj?.name || userObj?.email || 'this user';
    confirmModal({
      action: 'user.unblock',
      title: `Unblock ${label}?`,
      description: 'You will be able to exchange messages again.',
      variant: 'primary',
      confirmLabel: 'Unblock',
      onConfirm: async () => {
        const { data } = await userUnblockAsync(userId);
        if (data.success) {
          setBlockedUsers(blockedUsers.filter(u => u._id !== userId));
          toast.success('User unblocked');
        }
      },
      meta: { userId }
    });
  };

  const handleLogout = async () => {
    confirmModal({
      action: 'auth.logout',
      title: 'Logout?',
      description: 'You will be signed out of ChatHive on this device.',
      variant: 'danger',
      confirmLabel: 'Logout',
      onConfirm: async () => {
        await logoutAsync();
        disconnectSocket();
        toast.success('Logged out successfully');
        navigate('/login');
      }
    });
  };

  const filteredChats = chats.filter((chat) => {
    const chatName = chat.isGroupChat
      ? chat.chatName
      : chat.users.find((u) => u._id !== user._id)?.name || '';
    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'chats') {
      return matchesSearch;
    } else if (activeTab === 'friends') {
      // Show chats with friends only
      const otherUser = chat.users.find((u) => u._id !== user._id);
      const isFriend = friends.some(f => f._id === otherUser?._id);
      return matchesSearch && isFriend;
    } else if (activeTab === 'groups') {
      // Show only group chats
      return matchesSearch && !!chat.isGroupChat;
    }
    return matchesSearch;
  });

  return (
    <div className="w-full md:w-96 lg:w-[420px] bg-panel border-r border-default flex flex-col h-full">
      {showNewChat ? (
        // Full replacement sidebar for New Chat
        <>
          <NewChatView onBack={() => setShowNewChat(false)} chats={chats} showHeader={true} />
        </>
      ) : (
        <>
          {/* Header */}
          <div className="p-4 bg-header flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-primary">ChatHive</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 rounded-full hover-surface transition-colors"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5 text-secondary" />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={async () => { setNotifOpen(true); await fetchInvites(true); await markAllInvitesRead(); await fetchPendingSent(true); }}
                    className="p-2 rounded-full hover-surface transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 text-secondary" />
                    {(invites.filter((i) => !i.read).length + (pendingSent?.length || 0)) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                        {invites.filter((i) => !i.read).length + (pendingSent?.length || 0)}
                      </span>
                    )}
                  </button>
                  {/* Dedicated modal for notifications */}
                  {notifOpen && (
                    <NotificationsModal open={notifOpen} onClose={() => setNotifOpen(false)} />
                  )}
                </div>

                {/* Profile Avatar */}
                <button
                  className="hover:opacity-80 transition-opacity"
                  title="Profile"
                >
                  <Avatar src={user?.avatar?.url} alt={user?.name} size="sm" />
                </button>

                {/* Three Dots Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-full hover-surface transition-colors"
                    title="Menu"
                  >
                    <MoreVertical className="w-5 h-5 text-secondary" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-panel rounded-lg shadow-lg border border-default py-1 z-50">
                      <button
                        onClick={() => { toggleTheme(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-primary hover-surface flex items-center gap-3"
                      >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        Toggle theme
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-primary hover-surface flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover-surface flex items-center gap-3"
                        style={{ color: '#ef4444' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!showNewChat && (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                  <input
                    type="text"
                    placeholder="Search or start new chat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field input-with-icon pr-4 text-sm"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('chats')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'chats' ? 'btn-primary text-white' : 'bg-muted text-secondary hover-surface'}`}
                  >
                    Chats
                  </button>
                  <button
                    onClick={() => setActiveTab('friends')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'friends' ? 'btn-primary text-white' : 'bg-muted text-secondary hover-surface'}`}
                  >
                    Friends
                  </button>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'groups' ? 'btn-primary text-white' : 'bg-muted text-secondary hover-surface'}`}
                  >
                    Groups
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <ChatList
              chats={filteredChats.map((c) => ({
                ...c,
                unreadCount: unreadCounts[String(c._id)] || 0,
              }))}
              loading={loading || loadingUsers}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
