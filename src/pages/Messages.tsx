import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, User, ArrowLeft } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import type { Conversation, Message } from '@/types';

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, messages, fetchConversations, fetchMessages, sendMessage, connect, setCurrentConversation, currentConversation } = useChatStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = (conv: Conversation) => {
    setCurrentConversation(conv);
    fetchMessages(conv.task_id);
    connect(conv.task_id);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setCurrentConversation(null);
    setInputValue('');
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (chatOpen && currentConversation) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-t-2xl border border-warm-border border-b-0 px-5 py-3 flex items-center gap-3">
          <button onClick={closeChat} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden">
            {currentConversation.other_user_avatar ? (
              <img src={currentConversation.other_user_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-orange-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{currentConversation.other_user_name}</p>
            <p className="text-xs text-gray-400 truncate">{currentConversation.task_title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-warm-bg border-x border-warm-border px-4 py-4 space-y-3">
          {messages.map((msg) => {
            const isSelf = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    isSelf
                      ? 'bg-orange-500 text-white rounded-br-md'
                      : 'bg-white text-gray-700 border border-warm-border rounded-bl-md'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isSelf ? 'text-orange-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white rounded-b-2xl border border-warm-border border-t-0 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
        <div className="px-5 py-4 border-b border-warm-border">
          <h2 className="text-base font-bold text-gray-800">消息</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MessageCircle size={48} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">暂无消息</p>
            <p className="text-xs mt-1">接单或发单后即可与对方聊天</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={`${conv.task_id}_${conv.other_user_id}`}
              onClick={() => openChat(conv)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-warm-border last:border-b-0 hover:bg-orange-50/30 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden">
                  {conv.other_user_avatar ? (
                    <img src={conv.other_user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-orange-400" />
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{conv.other_user_name}</p>
                  <span className="text-xs text-gray-400 shrink-0">{formatTime(conv.last_message_time)}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">{conv.last_message}</p>
                <p className="text-xs text-orange-400 truncate mt-0.5">{conv.task_title}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
