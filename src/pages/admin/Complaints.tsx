import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Complaint, PaginatedResponse } from '@/types';

type StatusFilter = 'all' | 'pending' | 'processing' | 'resolved';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  pending: { bg: 'bg-orange-50', text: 'text-orange-500', icon: Clock },
  processing: { bg: 'bg-blue-50', text: 'text-blue-500', icon: RefreshCw },
  resolved: { bg: 'bg-green-50', text: 'text-green-500', icon: CheckCircle },
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export default function Complaints() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [resultInput, setResultInput] = useState('');
  const [showProcess, setShowProcess] = useState<number | null>(null);

  const fetchComplaints = () => {
    setLoading(true);
    const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
    api
      .get<PaginatedResponse<Complaint>>(`/admin/complaints?page=1&page_size=50${statusParam}`)
      .then((res) => {
        if (res.code === 0 && res.data) {
          setComplaints(Array.isArray(res.data) ? res.data : []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  if (user?.role !== 'platform_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertTriangle size={48} className="mb-3 opacity-40" />
        <p className="text-sm">无权访问此页面</p>
      </div>
    );
  }

  const handleProcess = async (id: number, action: 'start' | 'resolve') => {
    if (action === 'resolve') {
      if (!resultInput.trim()) return;
      setProcessingId(id);
      try {
        const res = await api.put(`/admin/complaints/${id}/resolve`, { result: resultInput.trim() });
        if (res.code === 0) {
          setResultInput('');
          setShowProcess(null);
          fetchComplaints();
        }
      } finally {
        setProcessingId(null);
      }
    } else {
      setProcessingId(id);
      try {
        const res = await api.put(`/admin/complaints/${id}/process`);
        if (res.code === 0) {
          fetchComplaints();
        }
      } finally {
        setProcessingId(null);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">投诉处理</h1>
        <button
          onClick={fetchComplaints}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === f.key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-warm-border hover:bg-orange-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && complaints.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertTriangle size={48} className="mb-3 opacity-40" />
          <p className="text-sm">暂无投诉记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending;
            const BadgeIcon = badge.icon;
            const isProcessing = showProcess === c.id;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl shadow-sm border border-warm-border p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{c.task_title}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                        <BadgeIcon size={12} />
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{c.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">投诉人：</span>
                    {c.complainant_name}
                  </div>
                  <div>
                    <span className="text-gray-400">被投诉人：</span>
                    {c.respondent_name}
                  </div>
                  <div>
                    <span className="text-gray-400">时间：</span>
                    {new Date(c.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>

                {c.result && (
                  <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700">
                    处理结果：{c.result}
                  </div>
                )}

                {c.status !== 'resolved' && (
                  <div className="flex items-center gap-2">
                    {c.status === 'pending' && (
                      <button
                        onClick={() => handleProcess(c.id, 'start')}
                        disabled={processingId === c.id}
                        className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        开始处理
                      </button>
                    )}
                    {(c.status === 'processing' || isProcessing) && (
                      <>
                        {!isProcessing && (
                          <button
                            onClick={() => setShowProcess(c.id)}
                            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            处理完成
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-3 pt-2 border-t border-warm-border">
                    <textarea
                      value={resultInput}
                      onChange={(e) => setResultInput(e.target.value)}
                      placeholder="请输入处理结果..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm resize-none transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProcess(c.id, 'resolve')}
                        disabled={processingId === c.id || !resultInput.trim()}
                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        确认提交
                      </button>
                      <button
                        onClick={() => { setShowProcess(null); setResultInput(''); }}
                        className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        取消
                      </button>
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
