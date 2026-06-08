import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Task, TaskCategory } from '@/types';

interface TaskFilters {
  category?: TaskCategory;
  urgency?: string;
  status?: string;
  reward_type?: string;
  community_id?: number;
  keyword?: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  filters: TaskFilters;
  sortBy: string;
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  category: string;
  sort: string;
  fetchTasks: (page?: number) => Promise<void>;
  fetchTask: (id: number) => Promise<void>;
  fetchTaskById: (id: number) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  claimTask: (id: number) => Promise<void>;
  completeTask: (id: number) => Promise<void>;
  confirmTask: (id: number, rating?: number, comment?: string) => Promise<void>;
  cancelTask: (id: number) => Promise<void>;
  setFilter: (filters: Partial<TaskFilters>) => void;
  setSortBy: (sortBy: string) => void;
  setCategory: (category: string) => void;
  setSort: (sort: string) => void;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  currentTask: null,
  filters: {},
  sortBy: 'latest',
  loading: false,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  category: '全部',
  sort: '最新发布',

  fetchTasks: async (page?: number) => {
    set({ loading: true });
    try {
      const { filters, sortBy, pagination, category, sort } = get();
      const currentPage = page || pagination.page;
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('page_size', String(pagination.pageSize));
      if (category && category !== '全部') params.set('category', category);
      if (sort) params.set('sort', sort);
      params.set('sort_by', sortBy);
      if (filters.urgency) params.set('urgency', filters.urgency);
      if (filters.status) params.set('status', filters.status);
      if (filters.reward_type) params.set('reward_type', filters.reward_type);
      if (filters.community_id) params.set('community_id', String(filters.community_id));
      if (filters.keyword) params.set('keyword', filters.keyword);

      const res = await api.get<Task[]>(`/tasks?${params.toString()}`);
      if (res.code === 0) {
        const taskList = Array.isArray(res.data) ? res.data : [];
        set({
          tasks: taskList,
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchTask: async (id: number) => {
    set({ loading: true });
    try {
      const res = await api.get<Task>(`/tasks/${id}`);
      if (res.code === 0 && res.data) {
        set({ currentTask: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchTaskById: async (id: number) => {
    set({ loading: true });
    try {
      const res = await api.get<Task>(`/tasks/${id}`);
      if (res.code === 0 && res.data) {
        set({ currentTask: res.data });
      }
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (data: Partial<Task>) => {
    const res = await api.post<Task>('/tasks', data);
    if (res.code === 0 && res.data) {
      set((state) => ({ tasks: [res.data!, ...state.tasks] }));
      return res.data;
    }
    throw new Error(res.message || '创建任务失败');
  },

  claimTask: async (id: number) => {
    const res = await api.post<Task>(`/tasks/${id}/claim`);
    if (res.code !== 0) {
      throw new Error(res.message || '认领任务失败');
    }
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'claimed' as const } : t)),
      currentTask: state.currentTask?.id === id ? { ...state.currentTask, status: 'claimed' as const } : state.currentTask,
    }));
  },

  completeTask: async (id: number) => {
    const res = await api.post<Task>(`/tasks/${id}/complete`);
    if (res.code !== 0) {
      throw new Error(res.message || '完成任务失败');
    }
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'completed' as const } : t)),
      currentTask: state.currentTask?.id === id ? { ...state.currentTask, status: 'completed' as const } : state.currentTask,
    }));
  },

  confirmTask: async (id: number, rating?: number, comment?: string) => {
    const res = await api.post<Task>(`/tasks/${id}/confirm`, { rating, comment });
    if (res.code !== 0) {
      throw new Error(res.message || '确认任务失败');
    }
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'confirmed' as const } : t)),
      currentTask: state.currentTask?.id === id ? { ...state.currentTask, status: 'confirmed' as const } : state.currentTask,
    }));
  },

  cancelTask: async (id: number) => {
    const res = await api.post<Task>(`/tasks/${id}/cancel`);
    if (res.code !== 0) {
      throw new Error(res.message || '取消任务失败');
    }
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: 'cancelled' as const } : t)),
      currentTask: state.currentTask?.id === id ? { ...state.currentTask, status: 'cancelled' as const } : state.currentTask,
    }));
  },

  setFilter: (filters: Partial<TaskFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  setSortBy: (sortBy: string) => {
    set({ sortBy, pagination: { ...get().pagination, page: 1 } });
  },

  setCategory: (category: string) => {
    set({ category });
    get().fetchTasks();
  },

  setSort: (sort: string) => {
    set({ sort });
    get().fetchTasks();
  },
}));
