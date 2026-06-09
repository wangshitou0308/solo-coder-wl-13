import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, DollarSign, MessageSquare, Star, Check, X, AlertTriangle,
  ArrowLeft, Send, Shield,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORY_LABELS } from '@/components/TaskCard';
import { toast } from '@/lib/toast';
import type { Review, ChatMessage } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: '待认领', bg: 'bg-blue-500', text: 'text-white' },
  claimed: { label: '进行中', bg: 'bg-orange-500', text: 'text-white' },
  completed: { label: '待验收', bg: 'bg-green-500', text: 'text-white' },
  confirmed: { label: '已完成', bg: 'bg-green-600', text: 'text-white' },
  cancelled: { label: '已取消', bg: 'bg-gray-400', text: 'text-white' },
};

const URGENCY_LABELS: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hover || value) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTask, loading, fetchTaskById, claimTask, completeTask, confirmTask, cancelTask } = useTaskStore();
  const { messages, connected, connect, disconnect, sendMessage, fetchMessages } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const [chatOpen, setChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const taskId = parseInt(id || '0', 10);

  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId);
      fetchMessages(taskId);
    }
    return () => {
      disconnect();
    };
  }, [taskId, fetchTaskById, fetchMessages, disconnect]);

  useEffect(() => {
    if (chatOpen && taskId && !connected) {
      connect(taskId);
    }
  }, [chatOpen, taskId, connected, connect]);

  useEffect(() => {
    if (currentTask?.status === 'confirmed' && taskId) {
      const token = localStorage.getItem('token');
      fetch(`/api/v1/tasks/${taskId}/review`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          const review = data.data || data;
          if (review && review.id) setExistingReview(review);
        })
        .catch(() => { /* ignored */ });
    }
  }, [currentTask?.status, taskId]);

  if (loading || !currentTask) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFBF0' }}>
        <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[currentTask.status] || STATUS_CONFIG.pending;
  const isPublisher = currentUser?.id === currentTask.publisher_id;
  const isClaimer = currentUser?.id === currentTask.claimer_id;
  const catLabel = CATEGORY_LABELS[currentTask.category] || currentTask.category;
  const publisherAvatar = currentTask.publisher_avatar || currentTask.publisher?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentTask.publisher_id}`;
  const publisherName = currentTask.publisher_name || currentTask.publisher?.username || `用户${currentTask.publisher_id}`;

  const isAdmin = currentUser?.role === 'community_admin' || currentUser?.role === 'platform_admin';
  const adminReviewed = (currentTask as any).admin_reviewed !== false;
  const isParticipant = isPublisher || isClaimer;
  const canSeeContactInfo = isParticipant || isAdmin;

  const handleClaim = async () => {
    setSubmitting(true);
    try {
      await claimTask(taskId);
      toast.success('认领成功，请尽快完成任务');
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('claimed by someone else') || msg.includes('已被其他人')) {
        toast.warning('手慢了，任务已被其他人认领');
        fetchTaskById(taskId);
      } else {
        toast.error(msg || '认领失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await completeTask(taskId);
      toast.success('已标记完成，等待发布者验收');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await confirmTask(taskId);
      toast.success('验收通过，感谢您的信任');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('确认验收不通过？此操作会取消任务并说明原因。')) return;
    setSubmitting(true);
    try {
      await cancelTask(taskId, '验收不通过');
      toast.success('已拒绝验收');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确认取消此任务吗？')) return;
    setSubmitting(true);
    try {
      await cancelTask(taskId);
      toast.success('任务已取消');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminReview = async (approved: boolean) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/admin/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (data.code === 0) {
        toast.success(approved ? '审核通过' : '已驳回');
        fetchTaskById(taskId);
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch {
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const maskEmail = (email?: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    if (name.length <= 2) return name + '***@' + domain;
    return name.slice(0, 2) + '***@' + domain;
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) return;
    const token = localStorage.getItem('token');
    const revieweeId = isPublisher ? currentTask.claimer_id : currentTask.publisher_id;
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment, reviewee_id: revieweeId }),
      });
      const data = await res.json();
      if (data.code === 0 || data.id) {
        toast.success('评价提交成功');
        setExistingReview(data.data || data);
        setReviewRating(0);
        setReviewComment('');
      } else {
        toast.error(data.message || '评价失败');
      }
    } catch {
      toast.error('评价失败');
    }
  };

  const reviewTargetName = isPublisher
    ? (currentTask.claimer_name || currentTask.claimer?.username || `用户${currentTask.claimer_id}`)
    : publisherName;

  const formatTime = (t: string) => {
    if (!t) return '';
    return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen" style={{ background: '#FFFBF0' }}>
      <div className={`${statusConf.bg} ${statusConf.text} py-3`}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">{statusConf.label}</span>
          </div>
          {currentTask.deadline && currentTask.status !== 'confirmed' && currentTask.status !== 'cancelled' && (
            <div className="flex items-center gap-1 text-sm opacity-90">
              <Clock className="w-4 h-4" />
              <span>截止: {formatTime(currentTask.deadline)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{currentTask.title}</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {catLabel}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 font-bold text-lg">
                    ¥{currentTask.reward + (currentTask.bounty || 0)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {currentTask.reward_type === 'credit' || currentTask.reward_type === 'fixed' ? '虚拟积分' : '现金'}
                  </span>
                </div>
                {currentTask.bounty && currentTask.bounty > 0 && (
                  <div className="text-xs text-gray-500 ml-6">
                    基础 ¥{currentTask.reward} + 赏金加成 ¥{currentTask.bounty}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>紧急程度: {URGENCY_LABELS[currentTask.urgency] || '普通'}</span>
              </div>
              {currentTask.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>{currentTask.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>发布于 {formatTime(currentTask.created_at)}</span>
              </div>
            </div>
            <div className="border-t border-orange-50 pt-4">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{currentTask.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
            <div className="flex items-center gap-3">
              <img
                src={publisherAvatar}
                alt=""
                className="w-12 h-12 rounded-full bg-orange-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{publisherName}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                    信用 {currentTask.publisher?.credit_score || 100}
                  </span>
                </div>
                {currentTask.publisher && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-gray-400">📧</span>
                      {canSeeContactInfo
                        ? currentTask.publisher.email
                        : maskEmail(currentTask.publisher.email)}
                      {!canSeeContactInfo && (
                        <span className="text-orange-500 ml-1">(认领后可见)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-gray-400">📱</span>
                      {canSeeContactInfo
                        ? currentTask.publisher.phone
                        : maskPhone(currentTask.publisher.phone)}
                      {!canSeeContactInfo && (
                        <span className="text-orange-500 ml-1">(认领后可见)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isClaimer && currentTask.claimer && (
            <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
              <div className="flex items-center gap-3">
                <img
                  src={
                    currentTask.claimer_avatar ||
                    currentTask.claimer?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${currentTask.claimer_id}`
                  }
                  alt=""
                  className="w-12 h-12 rounded-full bg-orange-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">
                    {currentTask.claimer_name || currentTask.claimer?.username || `用户${currentTask.claimer_id}`}
                    <span className="ml-2 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      任务承接者
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                      信用 {currentTask.claimer?.credit_score || 100}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-gray-400">📧</span>
                      {canSeeContactInfo
                        ? currentTask.claimer.email
                        : maskEmail(currentTask.claimer.email)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-gray-400">📱</span>
                      {canSeeContactInfo
                        ? currentTask.claimer.phone
                        : maskPhone(currentTask.claimer.phone)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTask.status === 'pending' && !isPublisher && (
            <button
              onClick={handleClaim}
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              认领任务
            </button>
          )}

          {currentTask.status === 'claimed' && isClaimer && (
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              标记完成
            </button>
          )}

          {currentTask.status === 'completed' && isPublisher && (
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                确认验收
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                拒绝验收
              </button>
            </div>
          )}

          {currentTask.status === 'pending' && isPublisher && (
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              取消任务
            </button>
          )}

          {isAdmin && !adminReviewed && currentTask.status === 'pending' && (
            <div className="bg-yellow-50/70 rounded-xl border border-yellow-200 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">审核面板</h3>
                  <p className="text-xs text-gray-500 mt-0.5">作为管理员审核此任务是否合规</p>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">任务ID</span>
                  <span className="font-mono text-gray-700">#{taskId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">发布者</span>
                  <span className="text-gray-700">{publisherName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">任务类别</span>
                  <span className="text-gray-700">{catLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">悬赏金额</span>
                  <span className="text-orange-600 font-semibold">¥{currentTask.reward}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAdminReview(false)}
                  disabled={submitting}
                  className="py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  {submitting ? '处理中...' : '驳回'}
                </button>
                <button
                  onClick={() => handleAdminReview(true)}
                  disabled={submitting}
                  className="py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? '处理中...' : '审核通过'}
                </button>
              </div>
            </div>
          )}

          {isAdmin && adminReviewed && (
            <div className="bg-green-50/70 rounded-xl border border-green-200 p-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-green-700">已审核</span>
                <span className="text-gray-500 ml-2">此任务已通过管理员审核</span>
              </div>
            </div>
          )}

          {currentTask.status === 'confirmed' && (
            <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-400" />
                评价{existingReview ? '' : ` · 评价 ${reviewTargetName}`}
              </h2>
              {existingReview ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= existingReview.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">{existingReview.rating} 分</span>
                  </div>
                  {existingReview.comment && (
                    <p className="text-gray-700 text-sm">{existingReview.comment}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">评价内容</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="分享您的评价..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 placeholder:text-gray-400 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!reviewRating}
                    className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    提交评价
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-80 flex-shrink-0">
          <ChatPanel
            messages={messages}
            currentUserId={currentUser?.id}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSend={handleSend}
            connected={connected}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-30"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {chatOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setChatOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
              <div className="p-3 border-b border-orange-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">任务沟通</h3>
                <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ChatPanel
                messages={messages}
                currentUserId={currentUser?.id}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                onSend={handleSend}
                connected={connected}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  messages,
  currentUserId,
  messageInput,
  setMessageInput,
  onSend,
  connected,
}: {
  messages: ChatMessage[];
  currentUserId?: number;
  messageInput: string;
  setMessageInput: (v: string) => void;
  onSend: () => void;
  connected: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无消息，开始沟通吧</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                  isOwn
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {!isOwn && msg.sender_name && (
                  <p className="text-xs text-gray-500 mb-0.5">{msg.sender_name}</p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-orange-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-orange-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder={connected ? '输入消息...' : '连接中...'}
            disabled={!connected}
            className="flex-1 px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 text-sm placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={!connected || !messageInput.trim()}
            className="w-9 h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
