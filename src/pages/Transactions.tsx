import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import type { Transaction, PaginatedResponse, UserStats } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  reward_income: '任务赏金',
  reward_expense: '支付赏金',
  withdraw: '提现',
  deposit: '充值',
  service_fee: '服务费',
  refund: '退款',
};

const INCOME_TYPES = new Set(['reward_income', 'deposit', 'refund']);
const FILTER_TABS = ['全部', '收入', '支出'] as const;

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('全部');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    api.get<UserStats>('/user/stats').then((res) => {
      if (res.code === 0 && res.data) setStats(res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<Transaction>>(`/user/transactions?page=${page}&page_size=${pageSize}`)
      .then((res) => {
        if (res.code === 0 && res.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          setTransactions(page === 1 ? list : (prev) => [...prev, ...list]);
          setTotal((res.data as any)?.total ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = transactions.filter((t) => {
    if (activeTab === '全部') return true;
    if (activeTab === '收入') return INCOME_TYPES.has(t.type);
    return !INCOME_TYPES.has(t.type);
  });

  const hasMore = page * pageSize < total;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <ArrowDownRight size={16} className="text-green-500" />
            </div>
            <span className="text-xs text-gray-400">总收入</span>
          </div>
          <p className="text-xl font-bold text-green-600">¥{stats?.total_income?.toFixed(2) ?? '0.00'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <ArrowUpRight size={16} className="text-red-500" />
            </div>
            <span className="text-xs text-gray-400">总支出</span>
          </div>
          <p className="text-xl font-bold text-red-500">¥{stats?.total_expense?.toFixed(2) ?? '0.00'}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-warm-border hover:bg-orange-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wallet size={40} className="mb-3 opacity-40" />
            <p className="text-sm">暂无交易记录</p>
          </div>
        ) : (
          <>
            {filtered.map((t) => {
              const isIncome = INCOME_TYPES.has(t.type);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-4 border-b border-warm-border last:border-b-0 hover:bg-orange-50/30 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownRight size={18} className="text-green-500" />
                    ) : (
                      <ArrowUpRight size={18} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{TYPE_LABELS[t.type] || t.type}</p>
                    {t.task_title && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{t.task_title}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                      {isIncome ? '+' : '-'}¥{Math.abs(t.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(t.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="w-full py-3 text-sm text-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ChevronDown size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? '加载中...' : '加载更多'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
