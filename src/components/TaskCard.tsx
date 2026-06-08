import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';
import type { Task, TaskCategory } from '@/types';

const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  normal: { label: '普通', color: 'bg-blue-50 text-blue-600' },
  high: { label: '高', color: 'bg-orange-50 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-50 text-red-600' },
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  delivery: '代取快递',
  pet: '遛宠物',
  repair: '家电维修',
  medical: '陪伴就医',
  tutor: '辅导作业',
  cleaning: '保洁',
  cooking: '做饭',
  moving: '搬家',
  other: '其他',
};

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  delivery: 'bg-blue-500',
  pet: 'bg-green-500',
  repair: 'bg-yellow-600',
  medical: 'bg-purple-500',
  tutor: 'bg-indigo-500',
  cleaning: 'bg-teal-500',
  cooking: 'bg-pink-500',
  moving: 'bg-orange-500',
  other: 'bg-gray-500',
};

function formatDeadline(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return '已过期';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}小时后`;
  return `${Math.floor(hours / 24)}天后`;
}

export default function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const urgency = URGENCY_MAP[task.urgency] || URGENCY_MAP.normal;
  const catColor = CATEGORY_COLORS[task.category] || 'bg-gray-500';
  const catLabel = CATEGORY_LABELS[task.category] || task.category;
  const publisherAvatar = task.publisher_avatar || task.publisher?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.publisher_id}`;
  const publisherName = task.publisher_name || task.publisher?.username || `用户${task.publisher_id}`;

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="bg-white rounded-xl shadow-sm border border-orange-50 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`${catColor} text-white text-xs px-2 py-0.5 rounded-full`}>
          {catLabel}
        </span>
        <span className={`${urgency.color} text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
          <AlertTriangle className="w-3 h-3" />
          {urgency.label}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{task.title}</h3>

      <div className="flex items-center gap-1 text-orange-600 font-bold text-lg mb-2">
        <span>¥</span>
        <span>{task.reward}</span>
      </div>

      {task.deadline && (
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <Clock className="w-3 h-3" />
          <span>{formatDeadline(task.deadline)}</span>
        </div>
      )}

      {task.address && (
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{task.address}</span>
          {task.distance !== undefined && (
            <span className="ml-auto text-orange-500 flex-shrink-0">{task.distance.toFixed(1)}km</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-orange-50">
        <img
          src={publisherAvatar}
          alt=""
          className="w-6 h-6 rounded-full bg-orange-100"
        />
        <span className="text-xs text-gray-600">{publisherName}</span>
      </div>
    </div>
  );
}

export { CATEGORY_LABELS, CATEGORY_COLORS };
