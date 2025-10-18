import { create } from 'zustand';

const useChatStore = create((set) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  notifications: [],
  onlineUsers: [],
  
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
}));

export default useChatStore;
