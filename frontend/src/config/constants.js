export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  GET_ME: '/api/auth/me',
  
  // Users
  GET_USERS: '/api/users',
  SEARCH_USERS: '/api/users/search',
  UPDATE_PROFILE: '/api/users/profile',
  UPDATE_AVATAR: '/api/users/avatar',
  UPDATE_PRIVACY: '/api/users/privacy',
  GET_USER: (id) => `/api/users/${id}`,
  ADD_FRIEND: (userId) => `/api/users/friends/${userId}`,
  REMOVE_FRIEND: (userId) => `/api/users/friends/${userId}`,
  BLOCK_USER: (userId) => `/api/users/block/${userId}`,
  UNBLOCK_USER: (userId) => `/api/users/block/${userId}`,
  
  // Chats
  GET_CHATS: '/api/chats',
  CREATE_CHAT: '/api/chats',
  ACCESS_CHAT: '/api/chats',
  DELETE_CHAT: (chatId) => `/api/chats/${chatId}`,
  CLEAR_CHAT: (chatId) => `/api/chats/${chatId}/clear`,
  CREATE_GROUP: '/api/chats/group',
  RENAME_GROUP: '/api/chats/group/rename',
  ADD_TO_GROUP: '/api/chats/group/add',
  REMOVE_FROM_GROUP: '/api/chats/group/remove',
  UPDATE_GROUP_AVATAR: '/api/chats/group/avatar',
  GROUP_MUTE: '/api/chats/group/mute',
  GROUP_LEAVE: '/api/chats/group/leave',
  GROUP_ADMIN_ADD: '/api/chats/group/admin/add',
  GROUP_ADMIN_REMOVE: '/api/chats/group/admin/remove',
  GROUP_INFO_UPDATE: '/api/chats/group/info',
  GROUP_DELETE_ALL: (chatId) => `/api/chats/group/${chatId}/all`,
  
  // Messages
  SEND_MESSAGE: '/api/messages',
  GET_MESSAGES: (chatId) => `/api/messages/${chatId}`,
  MARK_AS_READ: (chatId) => `/api/messages/read/${chatId}`,
  DELETE_MESSAGE: (messageId) => `/api/messages/${messageId}`,
  
  // Invites
  INVITES_PENDING: '/api/invites/pending',
  INVITES_SENT: '/api/invites/sent',
  INVITES_CREATE: '/api/invites',
  INVITE_ACCEPT: (id) => `/api/invites/${id}/accept`,
  INVITE_DECLINE: (id) => `/api/invites/${id}/decline`,
  INVITE_READ: (id) => `/api/invites/${id}/read`,
};

export const SOCKET_EVENTS = {
  // Emit
  SETUP: 'setup',
  JOIN_CHAT: 'join chat',
  TYPING: 'typing',
  STOP_TYPING: 'stop typing',
  NEW_MESSAGE: 'new message',
  MESSAGE_READ: 'message read',
  LEAVE_CHAT: 'leave chat',
  
  // Listen
  CONNECTED: 'connected',
  USER_ONLINE: 'user online',
  USER_OFFLINE: 'user offline',
  MESSAGE_RECEIVED: 'message received',
  USER_BLOCKED: 'user blocked',
  USER_UNBLOCKED: 'user unblocked',
  GROUP_NOTIFICATION: 'group notification',
  GROUP_UPDATED: 'group updated',
  INVITES_UPDATED: 'invites updated',
};
