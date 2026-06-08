import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/types';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  ws: WebSocket | null;
  isConnected: boolean;
  connected: boolean;
  currentConversation: Conversation | null;
  connect: (taskIdOrUserId: number) => void;
  disconnect: () => void;
  sendMessage: (contentOrTaskId: string | number, receiverId?: number, content?: string, type?: string) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (taskId: number) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
}

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  messages: [],
  ws: null,
  isConnected: false,
  connected: false,
  currentConversation: null,

  connect: (taskIdOrUserId: number) => {
    const { ws, isConnected } = get();
    if (ws && isConnected) return;

    const url = getWsUrl();
    const socket = new WebSocket(`${url}?task_id=${taskIdOrUserId}`);

    socket.onopen = () => {
      set({ isConnected: true, connected: true });
    };

    socket.onmessage = (event) => {
      try {
        const msg: Message = JSON.parse(event.data);
        set((state) => ({
          messages: [...state.messages, msg],
          conversations: state.conversations.map((conv) =>
            conv.task_id === msg.task_id
              ? { ...conv, last_message: msg.content, last_message_time: msg.created_at }
              : conv
          ),
        }));
      } catch {
        // ignore
      }
    };

    socket.onclose = () => {
      set({ isConnected: false, connected: false });
      setTimeout(() => {
        if (get().ws === socket) {
          get().connect(taskIdOrUserId);
        }
      }, 3000);
    };

    socket.onerror = () => {
      set({ isConnected: false, connected: false });
    };

    set({ ws: socket });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, isConnected: false, connected: false });
    }
  },

  sendMessage: (contentOrTaskId: string | number, receiverId?: number, content?: string, type: string = 'text') => {
    const { ws } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if (typeof contentOrTaskId === 'string') {
      const currentMessages = get().messages;
      const taskId = currentMessages.length > 0 ? currentMessages[0].task_id : 0;
      ws.send(JSON.stringify({ task_id: taskId, content: contentOrTaskId, type: 'text' }));
    } else {
      ws.send(JSON.stringify({ task_id: contentOrTaskId, receiver_id: receiverId, content, type }));
    }
  },

  fetchConversations: async () => {
    const res = await api.get<Conversation[]>('/messages/conversations');
    if (res.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : [res.data];
      set({ conversations: list });
    }
  },

  fetchMessages: async (taskId: number) => {
    const res = await api.get<Message[]>(`/messages?task_id=${taskId}`);
    if (res.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : [res.data];
      set({ messages: list });
    }
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation, messages: [] });
  },
}));
