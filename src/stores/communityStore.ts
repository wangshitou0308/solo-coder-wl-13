import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Community } from '@/types';

interface CommunityState {
  communities: Community[];
  currentCommunity: Community | null;
  nearbyCommunities: Community[];
  loading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
  joinByCode: (inviteCode: string) => Promise<Community>;
  joinByInviteCode: (inviteCode: string) => Promise<Community>;
  joinByLocation: (communityId: number) => Promise<void>;
  fetchNearby: (latitude: number, longitude: number) => Promise<void>;
  searchNearby: (latitude: number, longitude: number) => Promise<void>;
  clearError: () => void;
}

export const useCommunityStore = create<CommunityState>()((set) => ({
  communities: [],
  currentCommunity: null,
  nearbyCommunities: [],
  loading: false,
  error: null,

  fetchCommunities: async () => {
    set({ loading: true });
    try {
      const res = await api.get<Community[]>('/communities');
      if (res.code === 0 && res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        set({ communities: list, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  joinByCode: async (inviteCode: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<Community>('/communities/join', { invite_code: inviteCode });
      if (res.code === 0 && res.data) {
        set({ currentCommunity: res.data, loading: false });
        return res.data;
      }
      set({ error: res.message || '加入社区失败', loading: false });
      throw new Error(res.message || '加入社区失败');
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  joinByInviteCode: async (inviteCode: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<Community>('/communities/join', { invite_code: inviteCode });
      if (res.code === 0 && res.data) {
        set({ currentCommunity: res.data, loading: false });
        return res.data;
      }
      set({ error: res.message || '加入社区失败', loading: false });
      throw new Error(res.message || '加入社区失败');
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  joinByLocation: async (communityId: number) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<Community>('/communities/join-by-location', { community_id: communityId });
      if (res.code !== 0) {
        set({ error: res.message || '加入社区失败', loading: false });
        throw new Error(res.message || '加入社区失败');
      }
      set({ loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  fetchNearby: async (latitude: number, longitude: number) => {
    set({ loading: true });
    try {
      const res = await api.get<Community[]>(
        `/communities/nearby?latitude=${latitude}&longitude=${longitude}`
      );
      if (res.code === 0 && res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        set({ nearbyCommunities: list, communities: list, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  searchNearby: async (latitude: number, longitude: number) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<Community[]>(
        `/communities/nearby?latitude=${latitude}&longitude=${longitude}`
      );
      if (res.code === 0 && res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        set({ nearbyCommunities: list, communities: list, loading: false });
      } else {
        set({ error: res.message || '搜索附近社区失败', loading: false });
      }
    } catch {
      set({ error: '网络错误，请重试', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
