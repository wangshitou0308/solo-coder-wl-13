import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Settings, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { UserStats } from '@/types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetchUser();
    api.get<UserStats>('/user/stats').then((res) => {
      if (res.code === 0 && res.data) setStats(res.data);
    });
  }, [fetchUser]);

  const score = user?.credit_score ?? 0;
  const scoreColor = score < 60 ? '#EF4444' : score <= 80 ? '#F97316' : '#22C55E';
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  const roleLabel =
    user?.role === 'platform_admin'
      ? '平台管理员'
      : user?.role === 'community_admin'
      ? '社区管理员'
      : '普通用户';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-orange-50">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-orange-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate">{user?.username}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full">
                <CreditCard size={12} />
                {roleLabel}
              </span>
              {user?.community_name && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-600 px-2.5 py-0.5 rounded-full">
                  {user.community_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6">
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#FED7AA" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: scoreColor }}>
                {score}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">信用分</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">信用等级</p>
            <p className="text-sm text-gray-500">
              {score < 60
                ? '信用较低，请按时完成任务提升信用'
                : score <= 80
                ? '信用良好，继续保持优质服务'
                : '信用优秀，感谢您的可靠表现'}
            </p>
            <div className="flex items-center gap-1 mt-3">
              {score < 60 && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">待提升</span>}
              {score >= 60 && score <= 80 && <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">良好</span>}
              {score > 80 && <span className="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full">优秀</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-4 text-center">
          <TrendingUp size={22} className="mx-auto text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats?.published_count ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">发单数</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-4 text-center">
          <Wallet size={22} className="mx-auto text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats?.claimed_count ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">接单数</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-4 text-center">
          <Star size={22} className="mx-auto text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats ? (stats.completion_rate * 100).toFixed(0) : 0}%</p>
          <p className="text-xs text-gray-400 mt-1">完成率</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">当前余额</p>
            <p className="text-3xl font-bold mt-1">¥{user?.balance?.toFixed(2) ?? '0.00'}</p>
          </div>
          <Wallet size={40} className="text-orange-200 opacity-60" />
        </div>
        {user?.frozen_balance != null && user.frozen_balance > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-orange-100 text-sm">冻结余额</span>
              <span className="font-semibold">¥{user.frozen_balance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-orange-200/80 mt-1">任务进行中暂不可用的金额</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/profile/deposit')}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            <ArrowDownRight size={16} />
            充值
          </button>
          <button
            onClick={() => navigate('/profile/withdraw')}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            <ArrowUpRight size={16} />
            提现
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
        {[
          { icon: CreditCard, label: '收支明细', path: '/profile/transactions' },
          { icon: Star, label: '我的评价', path: '/profile/reviews' },
          { icon: Settings, label: '账户设置', path: '/profile/settings' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-orange-50/50 transition-colors border-b border-warm-border last:border-b-0"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <item.icon size={20} className="text-orange-500" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-gray-700">{item.label}</span>
            <ArrowUpRight size={16} className="text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
