import { useState, useEffect } from 'react';
import { Trophy, Medal, User } from 'lucide-react';
import { api } from '@/lib/api';
import type { LeaderboardItem } from '@/types';

type TabType = 'claimed' | 'rating';

const TAB_OPTIONS: { key: TabType; label: string }[] = [
  { key: 'claimed', label: '接单排行' },
  { key: 'rating', label: '好评排行' },
];

const MEDAL_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32'];

function generateMonths() {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = i === 0 ? '本月' : `${d.getMonth() + 1}月`;
    months.push({ value, label });
  }
  return months;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>('claimed');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const months = generateMonths();

  useEffect(() => {
    setLoading(true);
    api
      .get<LeaderboardItem[]>(`/leaderboard?type=${activeTab}&month=${month}`)
      .then((res) => {
        if (res.code === 0 && res.data) {
          setItems(Array.isArray(res.data) ? res.data : []);
        }
      })
      .finally(() => setLoading(false));
  }, [activeTab, month]);

  const top3 = items.slice(0, 3);
  const rest = items.slice(3);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white text-center">
        <Trophy size={40} className="mx-auto mb-2 drop-shadow" />
        <h1 className="text-xl font-bold">社区排行榜</h1>
        <p className="text-orange-100 text-sm mt-1">邻里互助，温暖同行</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-warm-border hover:bg-orange-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-warm-border bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full" />
              <div className="flex-1 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Medal size={48} className="mb-3 opacity-40" />
          <p className="text-sm">暂无排行数据</p>
        </div>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6">
              <div className="flex items-end justify-center gap-4">
                {top3.map((item, idx) => {
                  const order = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                  const podiumHeight = idx === 0 ? 'h-28' : idx === 1 ? 'h-20' : 'h-16';
                  return (
                    <div
                      key={item.user_id}
                      className="flex flex-col items-center"
                      style={{ order }}
                    >
                      <div className="relative mb-2">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ring-4"
                          style={{ borderColor: MEDAL_COLORS[idx] }}
                        >
                          {item.avatar ? (
                            <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={28} className="text-orange-400" />
                          )}
                        </div>
                        <div
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                          style={{ backgroundColor: MEDAL_COLORS[idx] }}
                        >
                          {idx + 1}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[80px]">
                        {item.username}
                      </p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: MEDAL_COLORS[idx] }}>
                        {activeTab === 'claimed' ? `${item.value}单` : `${item.value}%`}
                      </p>
                      <div
                        className={`w-20 ${podiumHeight} rounded-t-lg mt-2`}
                        style={{
                          background:
                            idx === 0
                              ? 'linear-gradient(to top, #F97316, #FBBF24)'
                              : idx === 1
                              ? 'linear-gradient(to top, #9CA3AF, #D1D5DB)'
                              : 'linear-gradient(to top, #B45309, #CD7F32)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
              {rest.map((item) => (
                <div
                  key={item.user_id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-warm-border last:border-b-0 hover:bg-orange-50/30 transition-colors"
                >
                  <span className="w-7 text-center text-sm font-bold text-gray-400">
                    {item.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden shrink-0">
                    {item.avatar ? (
                      <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-orange-400" />
                    )}
                  </div>
                  <p className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {item.username}
                  </p>
                  <span className="text-sm font-bold text-orange-500 shrink-0">
                    {activeTab === 'claimed' ? `${item.value}单` : `${item.value}%`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
