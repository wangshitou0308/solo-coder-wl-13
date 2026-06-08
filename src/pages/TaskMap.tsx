import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { List, MapPin, X, ChevronRight } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
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

export default function TaskMap() {
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks } = useTaskStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const tasksWithLocation = tasks.filter((t) => t.latitude && t.longitude);

  return (
    <div className="h-screen flex relative" style={{ background: '#FFFBF0' }}>
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-orange-100 flex-shrink-0 z-10`}>
        <div className="w-80 h-full flex flex-col">
          <div className="p-4 border-b border-orange-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">附近任务</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-orange-100 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : tasksWithLocation.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无带位置的任务</p>
              </div>
            ) : (
              tasksWithLocation.map((task) => (
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
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[39.9042, 116.4074]}
          zoom={13}
          className="h-full w-full"
          style={{ background: '#FFFBF0' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tasksWithLocation.map((task) => (
            <Marker key={task.id} position={[task.latitude, task.longitude]} icon={orangeIcon}>
              <Popup>
                <div className="min-w-[160px]">
                  <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                  <p className="text-orange-600 font-bold">¥{task.reward}</p>
                  <button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="mt-2 text-xs text-orange-600 hover:underline"
                  >
                    查看详情 →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
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
