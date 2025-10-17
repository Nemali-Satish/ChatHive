import { createSlice } from '@reduxjs/toolkit'

const chat = createSlice({
  name: 'chat',
  initialState: {
    activeChatId: null,
    chats: [],
    notifications: [],
  },
  reducers: {
    setActiveChat: (state, { payload }) => {
      state.activeChatId = payload
    },
    setChats: (state, { payload }) => {
      state.chats = payload || []
    },
    addNotification: (state, { payload }) => {
      state.notifications.unshift(payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setNotifications: (state, { payload }) => {
      state.notifications = Array.isArray(payload) ? payload : []
    },
  },
})

export const { setActiveChat, setChats, addNotification, clearNotifications, setNotifications } = chat.actions
export default chat
