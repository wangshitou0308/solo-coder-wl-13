import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: { phone?: string; email?: string; password: string }) => Promise<void>;
  register: (payload: { username: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshUserToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken'),
      isAuthenticated: !!localStorage.getItem('token'),
      loading: false,
      error: null,

      login: async (payload: { phone?: string; email?: string; password: string }) => {
        set({ loading: true, error: null });
        try {
          const account = payload.phone || payload.email || '';
          const res = await api.post<{ user: User; tokens: { access_token: string; refresh_token: string } }>(
            '/auth/login',
            { account, password: payload.password }
          );
          if (res.code === 0 && res.data) {
            localStorage.setItem('token', res.data.tokens.access_token);
            localStorage.setItem('refreshToken', res.data.tokens.refresh_token);
            set({
              token: res.data.tokens.access_token,
              refreshToken: res.data.tokens.refresh_token,
              user: res.data.user,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            set({ error: res.message || '登录失败', loading: false });
          }
        } catch {
          set({ error: '网络错误，请重试', loading: false });
        }
      },

      register: async (payload: { username: string; email: string; phone: string; password: string }) => {
        set({ loading: true, error: null });
        try {
          const res = await api.post<{ user: User; tokens: { access_token: string; refresh_token: string } }>(
            '/auth/register',
            payload
          );
          if (res.code === 0 && res.data) {
            localStorage.setItem('token', res.data.tokens.access_token);
            localStorage.setItem('refreshToken', res.data.tokens.refresh_token);
            set({
              token: res.data.tokens.access_token,
              refreshToken: res.data.tokens.refresh_token,
              user: res.data.user,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            set({ error: res.message || '注册失败', loading: false });
          }
        } catch {
          set({ error: '网络错误，请重试', loading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      loadUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await api.get<User>('/auth/me');
          if (res.code === 0 && res.data) {
            set({ user: res.data, isAuthenticated: true });
          } else {
            get().logout();
          }
        } catch {
          get().logout();
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        set({ loading: true });
        try {
          const res = await api.get<User>('/auth/me');
          if (res.code === 0 && res.data) {
            set({ user: res.data, isAuthenticated: true, loading: false });
          } else {
            set({ loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      refreshUserToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        try {
          const res = await api.post<{ token: string; refresh_token: string }>(
            '/auth/refresh',
            { refresh_token: refreshToken }
          );
          if (res.code === 0 && res.data) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('refreshToken', res.data.refresh_token);
            set({
              token: res.data.token,
              refreshToken: res.data.refresh_token,
            });
          }
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
