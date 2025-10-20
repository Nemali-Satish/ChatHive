import api from './api';
import { API_ENDPOINTS } from '../config/constants';

// Helper to build FormData from plain object and file inputs
const buildFormData = (data = {}, files = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  Object.entries(files).forEach(([key, fileOrList]) => {
    if (!fileOrList) return;
    if (Array.isArray(fileOrList)) {
      fileOrList.forEach((f) => f && formData.append(key, f));
    } else {
      formData.append(key, fileOrList);
    }
  });
  return formData;
};

// Invites
export const InviteService = {
  listPending: () => api.get(API_ENDPOINTS.INVITES_PENDING),
  listSent: () => api.get(API_ENDPOINTS.INVITES_SENT),
  create: ({ type, to, groupId, message }) => api.post(API_ENDPOINTS.INVITES_CREATE, { type, to, groupId, message }),
  accept: (id) => api.put(API_ENDPOINTS.INVITE_ACCEPT(id)),
  decline: (id) => api.put(API_ENDPOINTS.INVITE_DECLINE(id)),
  markRead: (id) => api.put(API_ENDPOINTS.INVITE_READ(id)),
};

// Auth
export const AuthService = {
  register: (payload) => api.post(API_ENDPOINTS.REGISTER, payload),
  login: (payload) => api.post(API_ENDPOINTS.LOGIN, payload),
  getMe: () => api.get(API_ENDPOINTS.GET_ME),
  logout: () => api.post(API_ENDPOINTS.LOGOUT),
};

// Users
export const UserService = {
  getUsers: (params) => api.get(API_ENDPOINTS.GET_USERS, { params }),
  searchUsers: (query) => api.get(API_ENDPOINTS.SEARCH_USERS, { params: { q: query, query, search: query } }),
  updateProfile: (payload) => api.put(API_ENDPOINTS.UPDATE_PROFILE, payload),
  updateAvatar: (file) => {
    const form = buildFormData({}, { avatar: file });
    return api.put(API_ENDPOINTS.UPDATE_AVATAR, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updatePrivacy: (visibility) => api.put(API_ENDPOINTS.UPDATE_PRIVACY, { visibility }),
  getUser: (id) => api.get(API_ENDPOINTS.GET_USER(id)),
  addFriend: (userId) => api.post(API_ENDPOINTS.ADD_FRIEND(userId)),
  removeFriend: (userId) => api.delete(API_ENDPOINTS.REMOVE_FRIEND(userId)),
  blockUser: (userId) => api.post(API_ENDPOINTS.BLOCK_USER(userId)),
  unblockUser: (userId) => api.delete(API_ENDPOINTS.UNBLOCK_USER(userId)),
};

// Chats
export const ChatService = {
  getChats: () => api.get(API_ENDPOINTS.GET_CHATS),
  // Backend uses POST /api/chats for both access (DM) and creation semantics
  accessChat: (payload) => api.post(API_ENDPOINTS.ACCESS_CHAT, payload),
  createChat: (payload) => api.post(API_ENDPOINTS.CREATE_CHAT, payload),
  deleteChat: (chatId) => api.delete(API_ENDPOINTS.DELETE_CHAT(chatId)),
  clearChat: (chatId) => api.delete(API_ENDPOINTS.CLEAR_CHAT(chatId)),

  createGroup: (payload) => api.post(API_ENDPOINTS.CREATE_GROUP, payload),
  renameGroup: (payload) => api.put(API_ENDPOINTS.RENAME_GROUP, payload),
  addToGroup: (payload) => api.put(API_ENDPOINTS.ADD_TO_GROUP, payload),
  removeFromGroup: (payload) => api.put(API_ENDPOINTS.REMOVE_FROM_GROUP, payload),
  updateGroupAvatar: ({ chatId, file }) => {
    const form = buildFormData({ chatId }, { avatar: file });
    return api.put(API_ENDPOINTS.UPDATE_GROUP_AVATAR, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  leaveGroup: (payload) => api.put(API_ENDPOINTS.GROUP_LEAVE, payload),
  addAdmin: (payload) => api.put(API_ENDPOINTS.GROUP_ADMIN_ADD, payload),
  removeAdmin: (payload) => api.put(API_ENDPOINTS.GROUP_ADMIN_REMOVE, payload),
  updateGroupInfo: (payload) => api.put(API_ENDPOINTS.GROUP_INFO_UPDATE, payload),
  deleteGroupForAll: (chatId) => api.delete(API_ENDPOINTS.GROUP_DELETE_ALL(chatId)),
};

// Messages
export const MessageService = {
  sendMessage: ({ chatId, content, attachments = [] }, config = {}) => {
    const form = buildFormData({ chatId, content }, { attachments });
    return api.post(
      API_ENDPOINTS.SEND_MESSAGE,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
      }
    );
  },
  getMessages: (chatId, params) => api.get(API_ENDPOINTS.GET_MESSAGES(chatId), { params }),
  markAsRead: (chatId) => api.put(API_ENDPOINTS.MARK_AS_READ(chatId)),
  deleteMessage: (messageId) => api.delete(API_ENDPOINTS.DELETE_MESSAGE(messageId)),
};

// Optional: grouped export for convenience
const DataService = {
  auth: AuthService,
  users: UserService,
  chats: ChatService,
  messages: MessageService,
  invites: InviteService,
};

export default DataService;
