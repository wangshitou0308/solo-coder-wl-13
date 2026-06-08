import { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle, XCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Task, PaginatedResponse } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  delivery: '跑腿代购',
  pet: '宠物照看',
  repair: '维修服务',
  medical: '就医陪同',
  tutor: '辅导教学',
  cleaning: '清洁打扫',
  cooking: '做饭帮厨',
  moving: '搬家搬运',
  other: '其他',
};

export default function TaskReview() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    api
      .get<PaginatedResponse<Task>>('/admin/tasks?status=pending&page=1&page_size=50')
      .then((res) => {
        if (res.code === 0 && res.data) {
          setTasks(Array.isArray(res.data) ? res.data : []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (user?.role !== 'platform_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ClipboardCheck size={48} className="mb-3 opacity-40" />
        <p className="text-sm">无权访问此页面</p>
      </div>
    );
  }

  const handleAction = async (taskId: number, action: 'approve' | 'reject') => {
    setActionLoading(taskId);
    try {
      const res = await api.put(`/admin/tasks/${taskId}/${action}`);
      if (res.code === 0) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (expandedId === taskId) setExpandedId(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">任务审核</h1>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ClipboardCheck size={48} className="mb-3 opacity-40" />
          <p className="text-sm">暂无待审核任务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isExpanded = expandedId === task.id;
            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-orange-50/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{task.title}</span>
                      <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[task.category] || task.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                      <span>发布者: {task.publisher_name || `#${task.publisher_id}`}</span>
                      <span>赏金: ¥{task.reward.toFixed(2)}</span>
                      <span>{new Date(task.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(task.id, 'approve'); }}
                      disabled={actionLoading === task.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      通过
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(task.id, 'reject'); }}
                      disabled={actionLoading === task.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      拒绝
                    </button>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-warm-border pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">任务描述：</span>
                        <span className="text-gray-700">{task.description}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">地址：</span>
                        <span className="text-gray-700">{task.address}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">紧急程度：</span>
                        <span className="text-gray-700">{task.urgency}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">截止时间：</span>
                        <span className="text-gray-700">{new Date(task.deadline).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">赏金类型：</span>
                        <span className="text-gray-700">{task.reward_type === 'cash' ? '现金' : '积分'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">社区：</span>
                        <span className="text-gray-700">{task.community_name || `#${task.community_id}`}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
