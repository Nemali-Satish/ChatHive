import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Settings, LogOut, MoreVertical, Users, Ban, Sun, Moon } from 'lucide-react';
import ChatList from './ChatList';
import NewChatView from './NewChatView';
import Avatar from '../ui/Avatar';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import { disconnectSocket } from '../../services/socket';
import toast from 'react-hot-toast';
import { initializeSocket, getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { useConfirmModal } from '../../context/ConfirmProvider';

const Sidebar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const menuRef = useRef(null);
  const { selectedChat } = useChatStore();
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
  }, []);

  // Listen for global refresh event (e.g., after deleting a chat from ChatWindow)
  useEffect(() => {
    const handler = () => {
      fetchChats(true);
      fetchUserData();
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
      }
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

      return () => {
        socket.off(SOCKET_EVENTS.CONNECTED, onConnected);
        socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED, onMessageReceived);
        socket.off(SOCKET_EVENTS.NEW_MESSAGE, onMessageReceived);
        socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
        socket.off(SOCKET_EVENTS.USER_BLOCKED, onUserBlocked);
        socket.off(SOCKET_EVENTS.USER_UNBLOCKED, onUserUnblocked);
      };
    } catch (e) {
      console.error('Socket setup failed', e);
    }
  }, [user?._id]);

  // Clear unread count when opening a chat
  useEffect(() => {
    if (selectedChat?._id) {
      setUnreadCounts((prev) => {
        const key = String(selectedChat._id);
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      // Optionally mark as read on server
      try {
        api.put(API_ENDPOINTS.MARK_AS_READ(selectedChat._id));
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
      const { data } = await api.get(API_ENDPOINTS.GET_CHATS);
      if (data.success) {
        setChats(data.data);
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
      const { data } = await api.get(API_ENDPOINTS.GET_USER(user._id));
      if (data.success) {
        setFriends(data.data.friends || []);
        setBlockedUsers(data.data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Failed to fetch user data');
    } finally {
      setLoadingUsers(false);
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
        const { data } = await api.delete(API_ENDPOINTS.REMOVE_FRIEND(userId));
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
        const { data } = await api.delete(API_ENDPOINTS.UNBLOCK_USER(userId));
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
        await api.post(API_ENDPOINTS.LOGOUT);
        disconnectSocket();
        logout();
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
    } else if (activeTab === 'blocked') {
      // Show chats with blocked users only
      const otherUser = chat.users.find((u) => u._id !== user._id);
      const isBlocked = blockedUsers.some(b => b._id === otherUser?._id);
      return matchesSearch && isBlocked;
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
                    onClick={() => setActiveTab('blocked')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'blocked' ? 'btn-primary text-white' : 'bg-muted text-secondary hover-surface'}`}
                  >
                    Blocked
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
