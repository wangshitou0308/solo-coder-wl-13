import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, PlusCircle, ClipboardCheck, DollarSign, ArrowRight, Activity } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

interface DashboardStats {
  total_users: number;
  total_tasks: number;
  today_new_tasks: number;
  pending_review_tasks: number;
  platform_income: number;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  time: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    api.get<DashboardStats>('/admin/dashboard').then((res) => {
      if (res.code === 0 && res.data) setStats(res.data);
    });
    api.get<ActivityItem[]>('/admin/activities').then((res) => {
      if (res.code === 0 && res.data) {
        setActivities(Array.isArray(res.data) ? res.data : []);
      }
    });
  }, []);

  if (user?.role !== 'platform_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users size={48} className="mb-3 opacity-40" />
        <p className="text-sm">无权访问此页面</p>
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: '总用户数', value: stats?.total_users ?? 0, color: 'bg-blue-50 text-blue-500' },
    { icon: FileText, label: '总任务数', value: stats?.total_tasks ?? 0, color: 'bg-orange-50 text-orange-500' },
    { icon: PlusCircle, label: '今日新增任务', value: stats?.today_new_tasks ?? 0, color: 'bg-green-50 text-green-500' },
    { icon: ClipboardCheck, label: '待审核任务', value: stats?.pending_review_tasks ?? 0, color: 'bg-amber-50 text-amber-500' },
    { icon: DollarSign, label: '平台收入', value: `¥${stats?.platform_income?.toFixed(2) ?? '0.00'}`, color: 'bg-purple-50 text-purple-500' },
  ];

  const quickLinks = [
    { to: '/admin/tasks', label: '任务审核', icon: ClipboardCheck },
    { to: '/admin/complaints', label: '投诉处理', icon: Activity },
    { to: '/admin/config', label: '平台配置', icon: DollarSign },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">管理面板</h1>
        <p className="text-orange-100 text-sm mt-1">NeighborTask 后台管理系统</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-warm-border p-4">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={20} />
            </div>
            <p className="text-xs text-gray-400">{card.label}</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-border">
            <h3 className="text-sm font-bold text-gray-700">最近动态</h3>
          </div>
          {activities.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">暂无动态</div>
          ) : (
            activities.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-warm-border last:border-b-0"
              >
                <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                <p className="flex-1 text-sm text-gray-600 truncate">{item.description}</p>
                <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-border">
            <h3 className="text-sm font-bold text-gray-700">快捷入口</h3>
          </div>
          {quickLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-warm-border last:border-b-0 hover:bg-orange-50/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <link.icon size={20} className="text-orange-500" />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-gray-700">{link.label}</span>
              <ArrowRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
