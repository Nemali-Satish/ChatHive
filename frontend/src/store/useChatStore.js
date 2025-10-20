import { create } from 'zustand';
import DataService from '../services/dataService';

const useChatStore = create((set) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  notifications: [],
  onlineUsers: [],
  infoPanelOpen: false,
  
  setChats: (chats) => set({ chats }),
  
  addChat: (chat) => set((state) => ({
    chats: [chat, ...state.chats],
  })),
  
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat._id === chatId ? { ...chat, ...updates } : chat
    ),
  })),
  
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setInfoPanelOpen: (open) => set({ infoPanelOpen: open }),
  toggleInfoPanel: () => set((state) => ({ infoPanelOpen: !state.infoPanelOpen })),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg._id === messageId ? { ...msg, ...updates } : msg
    ),
  })),
  
  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((msg) => msg._id !== messageId),
  })),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification],
  })),
  
  removeNotification: (chatId) => set((state) => ({
    notifications: state.notifications.filter((n) => n.chat._id !== chatId),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  addOnlineUser: (userId) => set((state) => ({
    onlineUsers: [...new Set([...state.onlineUsers, userId])],
  })),
  
  removeOnlineUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter((id) => id !== userId),
  })),

  // Async network actions
  fetchChats: async () => {
    const res = await DataService.chats.getChats();
    if (res.data?.success) set({ chats: res.data.data || [] });
    return res;
  },

  fetchMessages: async (chatId) => {
    if (!chatId) return { data: { success: false, data: [] } };
    const res = await DataService.messages.getMessages(chatId);
    if (res.data?.success) set({ messages: res.data.data || [] });
    else set({ messages: [] });
    return res;
  },

  markChatRead: async (chatId) => {
    if (!chatId) return;
    try { await DataService.messages.markAsRead(chatId); } catch {}
  },

  sendMessageAsync: async ({ chatId, content, attachments = [], onUploadProgress }) => {
    const res = await DataService.messages.sendMessage({ chatId, content, attachments }, { onUploadProgress });
    if (res.data?.success) {
      const message = res.data.data;
      set((state) => {
        const nextMessages = [...state.messages, message];
        // Update chats: set latestMessage and move chat to top
        const idx = state.chats.findIndex((c) => (c._id === chatId));
        let nextChats = state.chats.slice();
        if (idx !== -1) {
          const updatedChat = { ...nextChats[idx], latestMessage: message };
          nextChats.splice(idx, 1);
          nextChats = [updatedChat, ...nextChats];
        }
        return { messages: nextMessages, chats: nextChats };
      });
      // Also broadcast a lightweight refresh event for other components that rely on it
      try { window.dispatchEvent(new Event('refresh-chats')); } catch {}
    }
    return res;
  },

  createChatAsync: async (userId) => {
    const res = await DataService.chats.createChat({ userId });
    if (res.data?.success) {
      set((state) => ({ chats: [res.data.data, ...state.chats] }));
    }
    return res;
  },

  createGroupAsync: async (payload) => {
    const res = await DataService.chats.createGroup(payload);
    if (res.data?.success) set((state) => ({ chats: [res.data.data, ...state.chats] }));
    return res;
  },

  updateGroupInfoAsync: async (payload) => DataService.chats.updateGroupInfo(payload),
  updateGroupAvatarAsync: async ({ chatId, file }) => DataService.chats.updateGroupAvatar({ chatId, file }),
  leaveGroupAsync: async (chatId) => DataService.chats.leaveGroup({ chatId }),
  deleteGroupForAllAsync: async (chatId) => DataService.chats.deleteGroupForAll(chatId),
  clearChatAsync: async (chatId) => DataService.chats.clearChat(chatId),
  deleteChatAsync: async (chatId) => DataService.chats.deleteChat(chatId),

  // Group membership/admin actions
  addToGroupAsync: async ({ chatId, userId }) => DataService.chats.addToGroup({ chatId, userId }),
  removeFromGroupAsync: async ({ chatId, userId }) => DataService.chats.removeFromGroup({ chatId, userId }),
  addAdminAsync: async ({ chatId, userId }) => DataService.chats.addAdmin({ chatId, userId }),
  removeAdminAsync: async ({ chatId, userId }) => DataService.chats.removeAdmin({ chatId, userId }),

  // User ops (friend/block) to keep components clean
  userAddFriendAsync: async (userId) => DataService.users.addFriend(userId),
  userRemoveFriendAsync: async (userId) => DataService.users.removeFriend(userId),
  userBlockAsync: async (userId) => DataService.users.blockUser(userId),
  userUnblockAsync: async (userId) => DataService.users.unblockUser(userId),
  fetchUserDataAsync: async (userId) => DataService.users.getUser(userId),

  // User list/search helpers
  searchUsersAsync: async (query) => DataService.users.searchUsers(query),
  listUsersAsync: async (params) => DataService.users.getUsers(params),

  // Invites
  listPendingInvitesAsync: async () => DataService.invites.listPending(),
  listPendingInvitesSentAsync: async () => DataService.invites.listSent(),
  createInviteAsync: async ({ type, to, groupId, message }) => DataService.invites.create({ type, to, groupId, message }),
  acceptInviteAsync: async (id) => DataService.invites.accept(id),
  declineInviteAsync: async (id) => DataService.invites.decline(id),
  markInviteReadAsync: async (id) => DataService.invites.markRead(id),
}));

export default useChatStore;
