import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, MessageCircle, Send } from 'lucide-react';
import Avatar from '../ui/Avatar';
import GroupCreateModal from './GroupCreateModal';
// Network handled via store actions
import toast from 'react-hot-toast';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';

export default function NewChatView({ onBack, chats = [], showHeader = true }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(null);
  const [showNewChatSearch, setShowNewChatSearch] = useState(false);
  const searchUsersAsync = useChatStore((s) => s.searchUsersAsync);
  const listUsersAsync = useChatStore((s) => s.listUsersAsync);
  const createChatAsync = useChatStore((s) => s.createChatAsync);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const { setSelectedChat, addChat } = useChatStore();
  const user = useAuthStore((state) => state.user);
  const createInviteAsync = useChatStore((s) => s.createInviteAsync);

  const getOtherUser = (chat, myId) => chat?.users?.find((u) => u?._id !== myId) || null;

  useEffect(() => {
    if (searchQuery.trim() || showNewChatSearch) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setUsers([]);
    }
  }, [searchQuery, showNewChatSearch]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const q = searchQuery.trim();
      let data;
      if (q.length > 0) {
        const res = await searchUsersAsync(q);
        data = res.data;
      } else {
        const res = await listUsersAsync();
        data = res.data;
      }
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : [];
        setUsers(list.filter((u) => u?._id !== user?._id));
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId) => {
    setCreatingChat(userId);
    try {
      const response = await createChatAsync(userId);
      if (response.data.success) {
        addChat(response.data.data);
        setSelectedChat(response.data.data);
        toast.success('Chat created successfully');
        // Ensure sidebar chat list updates immediately
        try { window.dispatchEvent(new Event('refresh-chats')); } catch {}
        onBack?.();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create chat';
      toast.error(errorMsg);
    } finally {
      setCreatingChat(null);
    }
  };

  const groupedUsers = (Array.isArray(users) ? users : []).reduce((acc, u) => {
    const displayLabel = (u?.name?.trim() || u?.email?.trim() || String(u?.phone || '') || 'Unknown').trim();
    const firstChar = displayLabel.charAt(0).toUpperCase();
    const groupKey = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(u);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-panel w-full">
      {showHeader && (
        <div className="bg-header border-b border-default">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover-surface transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h2 className="text-xl font-semibold text-primary">New Chat</h2>
          </div>

          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field input-with-icon pr-4 text-sm"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {!searchQuery && !showNewChatSearch && (
        <div className="border-b border-default">
          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full flex items-center gap-3 p-3 hover-surface transition-colors"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md" style={{ background: '#22c55e' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-medium text-primary">New group</span>
          </button>

          <button
            onClick={() => setShowNewChatSearch(true)}
            className="w-full flex items-center gap-3 p-3 hover-surface transition-colors border-b border-default"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md" style={{ background: '#22c55e' }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-medium text-primary">New chat</span>
          </button>

          <div className="px-4 py-3 bg-header">
            <p className="text-sm font-semibold text-secondary">Recent</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {(chats || []).map((c) => {
              const other = !c.isGroupChat ? getOtherUser(c, user?._id) : null;
              const title = c.isGroupChat ? c.chatName : (other?.name || other?.email || 'Unknown User');
              const avatar = c.isGroupChat ? null : other?.avatar?.url;
              return (
                <button
                  key={c._id}
                  onClick={() => { setSelectedChat(c); onBack?.(); }}
                  className="w-full flex items-center gap-3 p-3 px-4 hover-surface transition-colors"
                >
                  <Avatar src={avatar} alt={title} size="lg" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-primary truncate">{title}</p>
                    <p className="text-sm text-secondary truncate">{c.latestMessage?.content || (c.isGroupChat ? 'Group' : 'Tap to chat')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (searchQuery || showNewChatSearch) && users.length > 0 ? (
          <>
            <div className="px-4 py-3 bg-header">
              <p className="text-sm font-semibold text-secondary">Contacts on ChatHive</p>
            </div>
            {Object.keys(groupedUsers).sort().map((letter) => (
              <div key={letter}>
                <div className="px-4 py-2 bg-header">
                  <p className="text-sm font-bold text-secondary">{letter}</p>
                </div>
                {groupedUsers[letter].map((contact) => (
                  <div
                    key={contact?._id || `${(contact?.email || contact?.phone || Math.random()).toString()}-${letter}`}
                    className="w-full flex items-center gap-3 p-3 px-4 hover-surface transition-colors disabled:opacity-50"
                  >
                    <button onClick={() => handleSelectUser(contact._id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Avatar src={contact.avatar?.url} alt={contact.name} size="lg" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-primary truncate">
                          {contact?.name || contact?.email || contact?.phone || 'Unknown User'}
                          {contact._id === user._id && (
                            <span className="text-secondary"> (You)</span>
                          )}
                        </p>
                        <p className="text-sm text-secondary truncate">
                          {contact?.bio || 'Hey there! I am using ChatHive'}
                        </p>
                      </div>
                    </button>
                    <button
                      className="p-2 rounded-md hover-surface"
                      title="Send request"
                      aria-label="Send request"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await createInviteAsync({ type: 'message', to: contact._id });
                          toast.success('Request sent');
                        } catch {
                          toast.error('Failed to send request');
                        }
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    {creatingChat === contact._id && (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : (searchQuery || showNewChatSearch) && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-header rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-secondary" />
            </div>
            <p className="text-secondary font-medium text-center">No results found</p>
            <p className="text-sm text-secondary text-center mt-2">Try searching with a different name or email</p>
          </div>
        ) : !showNewChatSearch ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <MessageCircle className="w-10 h-10" style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-secondary font-medium text-center">Start a new conversation</p>
            <p className="text-sm text-secondary text-center mt-2 max-w-xs">Choose an option above or search for contacts</p>
          </div>
        ) : null}
      </div>
      {showGroupModal && (
        <GroupCreateModal open={showGroupModal} onClose={() => setShowGroupModal(false)} />
      )}
    </div>
  );
}
