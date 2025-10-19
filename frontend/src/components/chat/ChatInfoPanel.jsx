import React, { useEffect, useMemo, useState } from 'react';
import Avatar from '../ui/Avatar';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/constants';
import toast from 'react-hot-toast';
import { X, ArrowLeft, Edit2, Check, XCircle, Upload, Bell, BellOff, LogOut, Trash2, Eraser, Shield, UserPlus, UserMinus, Crown } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
// Central confirm modal provider hook
import { useConfirmModal } from '../../context/ConfirmProvider';
import { getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../config/constants';
import EditGroupModal from './EditGroupModal';

export default function ChatInfoPanel() {
  const { selectedChat, setSelectedChat, infoPanelOpen, setInfoPanelOpen } = useChatStore();
  const user = useAuthStore((s) => s.user);

  const isGroup = !!selectedChat?.isGroupChat;
  const meId = user?._id;
  const admins = new Set([selectedChat?.groupAdmin?._id || selectedChat?.groupAdmin, ...(selectedChat?.admins || [])].filter(Boolean).map((id) => (id?._id || id).toString()));
  const iAmAdmin = isGroup && admins.has(meId);

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(selectedChat?.chatName || '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(selectedChat?.description || '');
  const muted = useMemo(() => Array.isArray(selectedChat?.mutedBy) && selectedChat.mutedBy.some((id) => (id?._id || id) === meId), [selectedChat?.mutedBy, meId]);
  const [showAddMember, setShowAddMember] = useState(false);
  // global confirm modal
  const confirmModal = useConfirmModal();
  const [mounted, setMounted] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const handleClose = () => setInfoPanelOpen(false);

  const handleSaveInfo = async () => {
    if (!isGroup || !iAmAdmin) return setEditingName(false), setEditingDesc(false);
    try {
      const payload = { chatId: selectedChat._id };
      if (editingName) payload.name = name.trim();
      if (editingDesc) payload.description = description.trim();
      if (!payload.name && !payload.description) return;
      const { data } = await api.put(API_ENDPOINTS.GROUP_INFO_UPDATE, payload);
      if (data?.success) {
        useChatStore.getState().setSelectedChat(data.data);
        toast.success('Group updated');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update');
    } finally {
      setEditingName(false);
      setEditingDesc(false);
    }
  };

  // Socket sync for external updates (must be before any early returns)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onGroupUpdated = (payload) => {
      if (!payload) return;
      if (selectedChat && payload.chatId === selectedChat._id) {
        if (payload.deleted) {
          setSelectedChat(null);
          setInfoPanelOpen(false);
        }
        window.dispatchEvent(new Event('refresh-chats'));
      }
    };
    socket.on(SOCKET_EVENTS.GROUP_UPDATED, onGroupUpdated);
    return () => socket.off(SOCKET_EVENTS.GROUP_UPDATED, onGroupUpdated);
  }, [selectedChat?._id]);

  // Panel mount animation flag
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Admin-only: delete group for all
  const confirmDeleteGroupForAll = () => {
    confirmModal({
      title: 'Delete group for all?',
      description: 'This will remove the group and its messages for every member. This cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await api.delete(API_ENDPOINTS.GROUP_DELETE_ALL(selectedChat._id));
        window.dispatchEvent(new Event('refresh-chats'));
        setSelectedChat(null);
        setInfoPanelOpen(false);
        toast.success('Group deleted');
      },
    });
  };

  // Admin-only: membership
  const addMember = async (userId) => {
    try {
      const { data } = await api.put(API_ENDPOINTS.ADD_TO_GROUP, { chatId: selectedChat._id, userId });
      if (data?.success) {
        setSelectedChat(data.data);
        toast.success('Member added');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = (userId) => {
    const member = (selectedChat.users || []).find((u) => u._id === userId);
    const label = member?.name || member?.email || 'this user';
    confirmModal({
      title: `Remove ${label}?`,
      description: `Remove ${label} from the group?`,
      variant: 'danger',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        const { data } = await api.put(API_ENDPOINTS.REMOVE_FROM_GROUP, { chatId: selectedChat._id, userId });
        if (data?.success) {
          setSelectedChat(data.data);
          toast.success('Member removed');
        }
      },
    });
  };

  // Admin-only: admin role
  const toggleAdmin = (userId, makeAdmin) => {
    const member = (selectedChat.users || []).find((u) => u._id === userId);
    const label = member?.name || member?.email || 'this user';
    confirmModal({
      title: makeAdmin ? `Make ${label} admin?` : `Remove admin from ${label}?`,
      description: makeAdmin ? `Grant admin permissions to ${label}?` : `Revoke admin permissions from ${label}?`,
      variant: makeAdmin ? 'primary' : 'danger',
      confirmLabel: makeAdmin ? 'Make admin' : 'Remove',
      onConfirm: async () => {
        const ep = makeAdmin ? API_ENDPOINTS.GROUP_ADMIN_ADD : API_ENDPOINTS.GROUP_ADMIN_REMOVE;
        const { data } = await api.put(ep, { chatId: selectedChat._id, userId });
        if (data?.success) {
          setSelectedChat(data.data);
          toast.success(makeAdmin ? 'Promoted to admin' : 'Admin removed');
        }
      },
    });
  };

  // Exit group confirm (non-destructive for others, but destructive for self membership)
  const confirmExitGroup = () => {
    confirmModal({
      title: 'Exit group?',
      description: 'You will stop receiving messages from this group until re-added.',
      variant: 'danger',
      confirmLabel: 'Exit',
      onConfirm: async () => {
        await api.put(API_ENDPOINTS.GROUP_LEAVE, { chatId: selectedChat._id });
        window.dispatchEvent(new Event('refresh-chats'));
        setSelectedChat(null);
        setInfoPanelOpen(false);
        toast.success('Exited group');
      },
    });
  };

  const onAddMemberClose = (updated) => {
    setShowAddMember(false);
    if (updated) {
      window.dispatchEvent(new Event('refresh-chats'));
    }
  };


  const handleToggleMute = async () => {
    try {
      if (isGroup) {
        await api.put(API_ENDPOINTS.GROUP_MUTE, { chatId: selectedChat._id, mute: !muted });
        const nextMuted = muted ? (selectedChat.mutedBy || []).filter((id) => (id?._id || id) !== meId) : [ ...(selectedChat.mutedBy || []), meId ];
        useChatStore.getState().setSelectedChat({ ...selectedChat, mutedBy: nextMuted });
      } else {
        toast('Per-chat mute is not available yet');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update mute');
    }
  };

  const handleExitGroup = async () => {
    try {
      await api.put(API_ENDPOINTS.GROUP_LEAVE, { chatId: selectedChat._id });
      window.dispatchEvent(new Event('refresh-chats'));
      setSelectedChat(null);
      toast.success('Exited group');
      setInfoPanelOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to exit group');
    }
  };

  const confirmClearChat = () => {
    confirmModal({
      title: 'Clear chat?',
      description: 'This removes messages from your view. Others remain unaffected.',
      variant: 'danger',
      confirmLabel: 'Clear',
      onConfirm: async () => {
        await api.delete(API_ENDPOINTS.CLEAR_CHAT(selectedChat._id));
        toast.success('Chat cleared');
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
        setInfoPanelOpen(false);
        toast.success('Chat deleted');
      },
    });
  };

  if (!selectedChat) return null;

  const members = selectedChat.users || [];
  const title = isGroup ? (editingName ? name : (selectedChat.chatName || 'Group')) : (members.find((u) => u?._id !== meId)?.name || 'Contact');
  const subtitle = isGroup ? `Group · ${members.length} member${members.length === 1 ? '' : 's'}` : (members.find((u) => u?._id !== meId)?.email || '');
  const avatarUrl = isGroup ? selectedChat.groupAvatar?.url : (members.find((u) => u?._id !== meId)?.avatar?.url);

  return (
    <div className={`flex flex-col h-full w-full bg-panel border-l border-default transition-all duration-200 ease-out transform ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
      role="complementary" aria-label="Chat info panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-header border-b border-default">
        {/* Back on small/medium screens */}
        <button onClick={handleClose} className="p-2 rounded-full hover-surface lg:hidden" aria-label="Back to chat">
          <ArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <h3 className="text-sm font-semibold text-primary">{isGroup ? 'Group info' : 'Chat info'}</h3>
        <div className="flex items-center gap-2">
          {isGroup && iAmAdmin && (
            <button onClick={() => setShowEditGroup(true)} className="p-2 rounded-full hover-surface" aria-label="Edit group">
              <Edit2 className="w-5 h-5 text-secondary" />
            </button>
          )}
          {/* Close on large screens */}
          <button onClick={handleClose} className="p-2 rounded-full hover-surface hidden lg:inline-flex" aria-label="Close info">
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 py-6 flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar src={avatarUrl} alt={title} size="xl" />
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          {isGroup && iAmAdmin && (
            <button className="p-1 rounded hover-surface" onClick={() => setShowEditGroup(true)} aria-label="Edit group">
              <Edit2 className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>
        <div className="text-sm text-secondary">
          {isGroup ? (
            <div className="flex items-center gap-2">
              <span>{selectedChat.description || 'Add group description'}</span>
              {iAmAdmin && (
                <button className="p-1 rounded hover-surface" onClick={() => setShowEditGroup(true)} aria-label="Edit group details">
                  <Edit2 className="w-4 h-4 text-secondary" />
                </button>
              )}
            </div>
          ) : (
            <span>{subtitle}</span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Members (group) */}
        {isGroup && (
          <div>
            <div className="px-6 py-2 bg-header border-y border-default text-xs font-semibold text-secondary">Members</div>
            <div className="">
              {members.map((m) => (
                <div key={m._id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800">
                  <Avatar src={m.avatar?.url} alt={m.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary truncate">
                      {m.name} {admins.has((m?._id || '').toString()) && <span className="ml-1 inline-flex items-center gap-1 text-xs text-secondary"><Shield className="w-3 h-3" /> admin</span>}
                    </p>
                    <p className="text-xs text-secondary truncate">{m.email}</p>
                  </div>
                  {iAmAdmin && m._id !== meId && (
                    <div className="flex items-center gap-2">
                      {admins.has((m?._id || '').toString()) ? (
                        <button className="p-1 rounded hover-surface" title="Remove admin" onClick={() => toggleAdmin(m._id, false)}>
                          <Crown className="w-4 h-4 text-secondary" />
                        </button>
                      ) : (
                        <button className="p-1 rounded " title="Make admin" onClick={() => toggleAdmin(m._id, true)}>
                          <Crown className="w-4 h-4 text-secondary" />
                        </button>
                      )}
                      <button className="p-1 rounded hover-surface" title="Remove member" onClick={() => removeMember(m._id)}>
                        <UserMinus className="w-4 h-4 text-secondary" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {false && iAmAdmin && (
              <div className="px-6 py-4">
                <button onClick={() => setShowAddMember(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm">
                  <UserPlus className="w-4 h-4" />
                  Add members
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4">
          <div className="px-6 py-2 bg-header border-y border-default text-xs font-semibold text-secondary">Actions</div>
          <div style={{ borderColor: 'var(--border)' }}>
            {isGroup && iAmAdmin && (
              <button onClick={() => setShowAddMember(true)} className="w-full flex items-center gap-3 px-6 py-3 hover-surface">
                <UserPlus className="w-4 h-4 text-secondary" />
                <span className="text-sm text-primary">Add members</span>
              </button>
            )}
            <button onClick={handleToggleMute} className="w-full flex items-center gap-3 px-6 py-3 hover-surface">
              {muted ? <Bell className="w-4 h-4 text-secondary" /> : <BellOff className="w-4 h-4 text-secondary" />}
              <span className="text-sm text-primary">{muted ? 'Unmute notifications' : 'Mute notifications'}</span>
            </button>
            {isGroup ? (
              <button onClick={confirmExitGroup} className="w-full flex items-center gap-3 px-6 py-3 hover-surface" style={{ color: '#ef4444' }}>
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Exit group</span>
              </button>
            ) : (
              <>
                <button onClick={confirmClearChat} className="w-full flex items-center gap-3 px-6 py-3 hover-surface text-primary">
                  <Eraser className="w-4 h-4" />
                  <span className="text-sm">Clear chat</span>
                </button>
                <button onClick={confirmDeleteChat} className="w-full flex items-center gap-3 px-6 py-3 hover-surface" style={{ color: '#ef4444' }}>
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete chat</span>
                </button>
              </>
            )}
            {isGroup && iAmAdmin && (
              <button onClick={confirmDeleteGroupForAll} className="w-full flex items-center gap-3 px-6 py-3 hover-surface" style={{ color: '#ef4444' }}>
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete group for all</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {showAddMember && (
        <AddMemberModal open={showAddMember} onClose={onAddMemberClose} chat={selectedChat} />
      )}
      {showEditGroup && (
        <EditGroupModal
          open={showEditGroup}
          chat={selectedChat}
          onClose={(updated) => {
            setShowEditGroup(false);
            if (updated) {
              setSelectedChat(updated);
            }
          }}
        />
      )}
    </div>
  );
}
