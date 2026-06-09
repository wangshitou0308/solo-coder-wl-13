import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, MapPin, DollarSign, Clock, AlertTriangle, Plus, Image as ImageIcon, X } from 'lucide-react';
import { CATEGORY_LABELS } from '@/components/TaskCard';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/lib/toast';
import type { TaskCategory } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as TaskCategory, label })
);

const URGENCY_OPTIONS = [
  { value: 'low' as const, label: '低' },
  { value: 'normal' as const, label: '普通' },
  { value: 'high' as const, label: '高' },
  { value: 'urgent' as const, label: '紧急' },
];

const pickIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#F97316"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
  className: '',
  iconSize: [28, 42],
  iconAnchor: [14, 42],
});

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function TaskNew() {
  const navigate = useNavigate();
  const { createTask } = useTaskStore();
  const { user, fetchUser } = useAuthStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('delivery');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [rewardType, setRewardType] = useState<'credit' | 'cash'>('credit');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [deadline, setDeadline] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(39.9042);
  const [lng, setLng] = useState(116.4074);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handlePickLocation = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) {
      errors.title = '请输入任务标题';
    } else if (title.trim().length < 5) {
      errors.title = '标题至少需要5个字符';
    }
    if (!description.trim()) {
      errors.description = '请输入任务描述';
    } else if (description.trim().length < 10) {
      errors.description = '描述至少需要10个字符';
    }
    if (!reward || parseFloat(reward) <= 0) {
      errors.reward = '请输入大于0的悬赏金额';
    } else if (rewardType === 'cash' && user && parseFloat(reward) > (user.balance || 0)) {
      errors.reward = `余额不足，当前余额：¥${user.balance?.toFixed(2) || '0.00'}`;
    }
    if (!deadline) {
      errors.deadline = '请选择截止时间';
    } else if (new Date(deadline).getTime() <= Date.now()) {
      errors.deadline = '截止时间必须晚于当前时间';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, description, reward, rewardType, user, deadline]);

  useEffect(() => {
    if (title || description || reward || deadline) {
      validate();
    }
  }, [title, description, reward, rewardType, deadline, validate]);

  const handleImageUpload = () => {
    const mockImages = [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&h=200&fit=crop',
    ];
    const newImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setUploadedImages((prev) => [...prev, newImage + '&t=' + Date.now()]);
    toast.info('图片上传功能演示（UI占位）');
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) {
      const firstError = Object.values(validationErrors)[0];
      if (firstError) toast.warning(firstError);
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const finalRewardType = rewardType === 'credit' ? 'fixed' : 'cash';
      await createTask({
        title: title.trim(),
        category,
        description: description.trim(),
        reward: parseFloat(reward),
        reward_type: finalRewardType as any,
        urgency,
        deadline,
        address,
        location_address: address,
        latitude: lat,
        longitude: lng,
        images: uploadedImages,
      } as any);
      toast.success('任务发布成功');
      navigate('/tasks');
    } catch (err: any) {
      const msg = err?.message || '发布失败，请检查信息后重试';
      setErrorMsg(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  const isFormValid = validate() && !submitting;

  return (
    <div className="min-h-screen" style={{ background: '#FFFBF0' }}>
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-orange-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-orange-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">发布新任务</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            基本信息
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">任务标题 <span className="text-red-400 text-xs">（至少5字）</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入任务标题"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 placeholder:text-gray-400 ${validationErrors.title ? 'border-red-400' : 'border-orange-200'}`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">任务类别</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">任务描述 <span className="text-red-400 text-xs">（至少10字）</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细描述您的需求..."
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 placeholder:text-gray-400 resize-none ${validationErrors.description ? 'border-red-400' : 'border-orange-200'}`}
              />
              {validationErrors.description && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">紧急程度</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900"
              >
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止时间 <span className="text-red-400 text-xs">（需晚于当前）</span></label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 ${validationErrors.deadline ? 'border-red-400' : 'border-orange-200'}`}
                />
              </div>
              {validationErrors.deadline && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.deadline}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            悬赏设置
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">悬赏金额 <span className="text-red-400 text-xs">{'>0'}</span></label>
                {rewardType === 'cash' && user && (
                  <span className="text-xs text-gray-400">余额：¥{user.balance?.toFixed(2) || '0.00'}</span>
                )}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                <input
                  type="number"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 placeholder:text-gray-400 ${validationErrors.reward ? 'border-red-400' : 'border-orange-200'}`}
                />
              </div>
              {validationErrors.reward && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.reward}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">悬赏类型</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rewardType"
                    value="credit"
                    checked={rewardType === 'credit'}
                    onChange={() => setRewardType('credit')}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">虚拟积分</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rewardType"
                    value="cash"
                    checked={rewardType === 'cash'}
                    onChange={() => setRewardType('cash')}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">现金</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            图片附件
            <span className="text-xs font-normal text-gray-400">（选填，最多9张）</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {uploadedImages.map((img, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-orange-200 group"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {uploadedImages.length < 9 && (
              <button
                onClick={handleImageUpload}
                className="aspect-square rounded-lg border-2 border-dashed border-orange-200 hover:border-orange-400 hover:bg-orange-50/50 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 transition-colors gap-1"
              >
                <Plus className="w-7 h-7" />
                <span className="text-xs">添加图片</span>
              </button>
            )}
          </div>
          {uploadedImages.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <ImageIcon className="w-3.5 h-3.5" />
              已上传 {uploadedImages.length}/9 张图片
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full" />
            位置信息
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="请输入详细地址"
                  className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">点击地图选择位置</label>
              <div className="h-64 rounded-lg overflow-hidden border border-orange-200">
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  className="h-full w-full"
                  style={{ background: '#FFFBF0' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onPick={handlePickLocation} />
                  <Marker position={[lat, lng]} icon={pickIcon} />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-orange-50 text-orange-700 text-sm rounded-xl px-4 py-3 border border-orange-200 space-y-1">
            <p className="font-medium mb-1">请修正以下问题后继续：</p>
            {Object.values(validationErrors).map((err, i) => (
              <p key={i} className="flex items-center gap-1.5">
                <span className="text-orange-500">•</span>
                {err}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="flex-1 py-3 rounded-lg border border-orange-200 text-gray-600 font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="flex-1 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? '发布中...' : '发布任务'}
          </button>
        </div>
      </div>
    </div>
  );
}
