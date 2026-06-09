import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { List, MapPin, X, ChevronRight, AlertTriangle, Navigation } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/components/TaskCard';
import { SkeletonList } from '@/components/Skeleton';
import { toast } from '@/lib/toast';
import type { Task } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const orangeIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#F97316"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
  className: '',
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  normal: { label: '普通', color: 'bg-blue-50 text-blue-600' },
  high: { label: '高', color: 'bg-orange-50 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-50 text-red-600' },
};

function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TaskMap() {
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks } = useTaskStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.9042, 116.4074]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError(false);
        },
        () => {
          setMapCenter([39.9042, 116.4074]);
          setLocationError(true);
          toast.warning('无法获取您的位置，使用默认坐标（北京）');
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      setLocationError(true);
      toast.warning('浏览器不支持定位，使用默认坐标（北京）');
    }
  }, []);

  const tasksWithLocation = tasks.filter(
    (t) => t.latitude && t.longitude && t.latitude !== 0 && t.longitude !== 0
  );
  const tasksWithoutLocation = tasks.filter(
    (t) => !t.latitude || !t.longitude || t.latitude === 0 || t.longitude === 0
  );
  const hasUnlocatedTasks = tasksWithoutLocation.length > 0;

  const getTaskDistance = (task: Task) => {
    if (!userLocation) return task.distance;
    return calculateDistance(userLocation.lat, userLocation.lng, task.latitude, task.longitude);
  };

  return (
    <div className="h-screen flex relative" style={{ background: '#FFFBF0' }}>
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-orange-100 flex-shrink-0 z-10`}>
        <div className="w-80 h-full flex flex-col">
          <div className="p-4 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">附近任务</h2>
              {userLocation && (
                <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  <Navigation className="w-3 h-3" />
                  定位中
                </span>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {locationError && (
            <div className="mx-3 mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700">
                无法获取您的位置，已使用默认坐标
              </p>
            </div>
          )}

          {hasUnlocatedTasks && (
            <div className="mx-3 mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              <div className="text-xs text-orange-700">
                <p className="mb-1">地图无法显示全部任务（{tasksWithoutLocation.length}个无坐标）</p>
                <Link to="/tasks" className="underline font-medium">
                  查看完整列表 →
                </Link>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <SkeletonList count={5} />
              </div>
            ) : tasksWithLocation.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无带位置的任务</p>
              </div>
            ) : (
              tasksWithLocation.map((task) => {
                const distance = getTaskDistance(task);
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="p-4 border-b border-orange-50 hover:bg-orange-50/50 cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{task.title}</h3>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {task.address || '未知位置'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600 font-bold text-sm">¥{task.reward}</span>
                      <div className="flex items-center gap-2">
                        {distance !== undefined && (
                          <span className="text-xs text-orange-500">{distance.toFixed(1)}km</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          className="h-full w-full"
          style={{ background: '#FFFBF0' }}
        >
          <MapCenterController center={mapCenter} zoom={13} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tasksWithLocation.map((task) => {
            const distance = getTaskDistance(task);
            const catColor = CATEGORY_COLORS[task.category] || 'bg-gray-500';
            const catLabel = CATEGORY_LABELS[task.category] || task.category;
            const urgency = URGENCY_MAP[task.urgency] || URGENCY_MAP.normal;
            return (
              <Marker key={task.id} position={[task.latitude, task.longitude]} icon={orangeIcon}>
                <Popup>
                  <div className="min-w-[200px] bg-white rounded-xl p-0 -m-2" style={{ margin: '-2px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${catColor} text-white text-xs px-2 py-0.5 rounded-full`}>
                        {catLabel}
                      </span>
                      <span className={`${urgency.color} text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
                        <AlertTriangle className="w-3 h-3" />
                        {urgency.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-orange-600 font-bold text-lg">¥{task.reward}</p>
                      {distance !== undefined && (
                        <span className="text-xs text-orange-500 font-medium">{distance.toFixed(1)}km</span>
                      )}
                    </div>
                    {task.address && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {task.address}
                      </p>
                    )}
                    <button
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      查看详情
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-2 hover:bg-orange-50 transition-colors"
          >
            <List className="w-5 h-5 text-orange-600" />
          </button>
        )}
      </div>
    </div>
  );
}
