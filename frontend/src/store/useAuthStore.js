import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import DataService from '../services/dataService';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
        const updatedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...updatedUser, ...userData }));
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Async actions
      login: async (identifier, password) => {
        const res = await DataService.auth.login({ identifier, password });
        const data = res.data;
        if (data?.success) {
          const token = data.data?.token;
          const user = data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true });
        }
        return res;
      },

      register: async (payload) => {
        const res = await DataService.auth.register(payload);
        const data = res.data;
        if (data?.success) {
          const token = data.data?.token;
          const user = data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true });
        }
        return res;
      },

      fetchMe: async () => {
        const res = await DataService.auth.getMe();
        if (res.data?.success) {
          const user = res.data.data;
          localStorage.setItem('user', JSON.stringify(user));
          set((state) => ({ ...state, user }));
        }
        return res;
      },

      updateProfileAsync: async (payload) => {
        const res = await DataService.users.updateProfile(payload);
        if (res.data?.success) {
          const user = res.data.data;
          localStorage.setItem('user', JSON.stringify(user));
          set((state) => ({ ...state, user }));
        }
        return res;
      },

      updateAvatarAsync: async (file) => {
        const res = await DataService.users.updateAvatar(file);
        if (res.data?.success) {
          set((state) => ({ user: { ...state.user, avatar: res.data.data } }));
          const updatedUser = JSON.parse(localStorage.getItem('user')) || {};
          localStorage.setItem('user', JSON.stringify({ ...updatedUser, avatar: res.data.data }));
        }
        return res;
      },

      updatePrivacyAsync: async (visibility) => {
        const res = await DataService.users.updatePrivacy(visibility);
        if (res.data?.success) {
          set((state) => ({ user: { ...state.user, visibility: res.data.data.visibility } }));
          const updatedUser = JSON.parse(localStorage.getItem('user')) || {};
          localStorage.setItem('user', JSON.stringify({ ...updatedUser, visibility: res.data.data.visibility }));
        }
        return res;
      },

      logoutAsync: async () => {
        try { await DataService.auth.logout(); } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
