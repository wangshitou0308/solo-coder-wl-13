import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, MapPin, Search, Ticket, Navigation } from 'lucide-react';
import { useCommunityStore } from '@/stores/communityStore';

const MOCK_COMMUNITIES = [
  { id: 1, name: '阳光花园社区', address: '朝阳区阳光花园路88号', member_count: 326, latitude: 39.92, longitude: 116.46 },
  { id: 2, name: '翠湖名苑小区', address: '海淀区翠湖路12号', member_count: 218, latitude: 39.95, longitude: 116.32 },
  { id: 3, name: '和谐家园', address: '丰台区和谐大道56号', member_count: 189, latitude: 39.85, longitude: 116.28 },
];

type JoinMode = 'invite' | 'location';

export default function CommunityJoin() {
  const navigate = useNavigate();
  const { joinByInviteCode, joinByLocation, searchNearby, communities, loading, error, clearError } = useCommunityStore();
  const [mode, setMode] = useState<JoinMode>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const displayCommunities = communities.length > 0 ? communities : MOCK_COMMUNITIES;

  const handleInviteJoin = async () => {
    clearError();
    setLocalError('');
    if (!inviteCode.trim()) {
      setLocalError('请输入邀请码');
      return;
    }
    try {
      await joinByInviteCode(inviteCode.trim());
      navigate('/tasks');
    } catch {
      // error is set in store
    }
  };

  const handleLocationJoin = async (communityId: number) => {
    clearError();
    setLocalError('');
    setJoiningId(communityId);
    try {
      await joinByLocation(communityId);
      navigate('/tasks');
    } catch {
      // error is set in store
    } finally {
      setJoiningId(null);
    }
  };

  const handleSearchNearby = async () => {
    if (!navigator.geolocation) {
      setLocalError('您的浏览器不支持地理定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await searchNearby(position.coords.latitude, position.coords.longitude);
        } catch {
          // error handled in store
        }
      },
      () => {
        setLocalError('无法获取您的位置信息，请检查定位权限');
      }
    );
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
            <Home className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">加入你的社区</h1>
          <p className="text-gray-500 mt-1 text-sm">选择一种方式加入你所在的邻里社区</p>
        </div>

        {displayError && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
            {displayError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div
            className={`rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
              mode === 'invite'
                ? 'border-orange-400 bg-white shadow-lg shadow-orange-100'
                : 'border-gray-200 bg-white/70 hover:border-orange-200 hover:shadow-md'
            }`}
            onClick={() => { setMode('invite'); clearError(); setLocalError(''); }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                mode === 'invite' ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                <Ticket className={`w-6 h-6 ${mode === 'invite' ? 'text-orange-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">邀请码加入</h2>
                <p className="text-xs text-gray-500">输入社区邀请码快速加入</p>
              </div>
            </div>

            {mode === 'invite' && (
              <div className="space-y-4 mt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="请输入社区邀请码"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all duration-200 bg-white text-gray-800 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={handleInviteJoin}
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  {loading ? '加入中...' : '加入社区'}
                </button>
              </div>
            )}
          </div>

          <div
            className={`rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
              mode === 'location'
                ? 'border-orange-400 bg-white shadow-lg shadow-orange-100'
                : 'border-gray-200 bg-white/70 hover:border-orange-200 hover:shadow-md'
            }`}
            onClick={() => { setMode('location'); clearError(); setLocalError(''); }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                mode === 'location' ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                <MapPin className={`w-6 h-6 ${mode === 'location' ? 'text-orange-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">位置匹配加入</h2>
                <p className="text-xs text-gray-500">基于定位推荐附近社区</p>
              </div>
            </div>

            {mode === 'location' && (
              <div className="mt-4">
                <button
                  onClick={handleSearchNearby}
                  className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-orange-200"
                >
                  <Navigation className="w-4 h-4" />
                  获取附近社区
                </button>
              </div>
            )}
          </div>
        </div>

        {mode === 'location' && (
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
              <div className="h-48 bg-orange-50 relative flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-orange-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">地图视图将在此展示</p>
                  <p className="text-xs text-gray-300 mt-1">Leaflet 地图组件占位区域</p>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-800">附近社区</h3>
                </div>

                <div className="space-y-3">
                  {displayCommunities.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 border border-orange-100 hover:border-orange-200 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <h4 className="font-medium text-gray-800 truncate">{c.name}</h4>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 ml-6">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {c.address}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {c.member_count} 人
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLocationJoin(c.id); }}
                        disabled={loading && joiningId === c.id}
                        className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 flex-shrink-0"
                      >
                        {loading && joiningId === c.id ? '加入中' : '加入'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          加入社区后即可浏览和发布邻里互助任务
        </p>
      </div>
    </div>
  );
}
