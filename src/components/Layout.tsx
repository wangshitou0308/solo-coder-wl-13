import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutList,
  PlusCircle,
  MessageCircle,
  Trophy,
  User,
  Shield,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { to: '/tasks', icon: LayoutList, label: '任务大厅' },
  { to: '/tasks/new', icon: PlusCircle, label: '发布任务' },
  { to: '/messages', icon: MessageCircle, label: '消息' },
  { to: '/leaderboard', icon: Trophy, label: '排行榜' },
  { to: '/profile', icon: User, label: '个人中心' },
];

const adminItems = [
  { to: '/admin', icon: Shield, label: '管理面板' },
  { to: '/admin/tasks', icon: ClipboardCheck, label: '任务审核' },
  { to: '/admin/complaints', icon: AlertTriangle, label: '投诉处理' },
  { to: '/admin/config', icon: Settings, label: '平台配置' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'community_admin' || user?.role === 'platform_admin';

  return (
    <div className="flex h-screen bg-warm-bg">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-warm-border flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-warm-border">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-lg font-bold text-gray-800">NeighborTask</span>
          <button
            className="ml-auto lg:hidden text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-500'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-3 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Shield size={14} />
                管理员
              </div>
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-500'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="border-t border-warm-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-orange-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{user?.community_name || '未加入社区'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-warm-border flex items-center px-4 gap-3 shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400">
            <span>NeighborTask</span>
            <ChevronRight size={14} />
            <span className="text-gray-700">邻里互助</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {user?.community_name && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">
                {user.community_name}
              </span>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="text-orange-500 font-semibold">♥</span>
              <span>信用 {user?.credit_score ?? '--'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="text-orange-500 font-semibold">¥</span>
              <span>{user?.balance?.toFixed(2) ?? '0.00'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
