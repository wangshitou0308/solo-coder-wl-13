import { useState, useEffect } from 'react';
import { Settings, Save, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { PlatformConfig } from '@/types';

const CONFIG_FIELDS: { key: keyof PlatformConfig; label: string; description: string; type: string }[] = [
  {
    key: 'service_fee_rate',
    label: '服务费率',
    description: '平台从每笔交易中收取的服务费比例（如0.05表示5%）',
    type: 'number',
  },
  {
    key: 'min_withdraw_amount',
    label: '最低提现金额',
    description: '用户申请提现的最低金额限制（单位：元）',
    type: 'number',
  },
  {
    key: 'credit_score_base',
    label: '信用分基础值',
    description: '新用户注册时的初始信用分',
    type: 'number',
  },
  {
    key: 'credit_score_task_complete_bonus',
    label: '完成任务信用加分',
    description: '用户每完成一次任务获得的信用分奖励',
    type: 'number',
  },
  {
    key: 'credit_score_task_fail_penalty',
    label: '任务失败信用扣分',
    description: '用户因任务失败或取消扣除的信用分',
    type: 'number',
  },
  {
    key: 'credit_score_five_star_bonus',
    label: '五星好评信用加分',
    description: '用户获得五星评价时额外获得的信用分奖励',
    type: 'number',
  },
];

export default function Config() {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<PlatformConfig>({
    service_fee_rate: '0.05',
    min_withdraw_amount: '10',
    credit_score_base: '80',
    credit_score_task_complete_bonus: '2',
    credit_score_task_fail_penalty: '5',
    credit_score_five_star_bonus: '1',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get<PlatformConfig>('/admin/config').then((res) => {
      if (res.code === 0 && res.data) setConfig(res.data);
    });
  }, []);

  if (user?.role !== 'platform_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Shield size={48} className="mb-3 opacity-40" />
        <p className="text-sm">无权访问此页面</p>
      </div>
    );
  }

  const handleChange = (key: keyof PlatformConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/admin/config', config);
      if (res.code === 0) {
        setMessage({ type: 'success', text: '保存成功' });
      } else {
        setMessage({ type: 'error', text: res.message || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Settings size={22} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800">平台配置</h1>
          <p className="text-xs text-gray-400">管理系统全局参数设置</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6 space-y-6">
        {CONFIG_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <p className="text-xs text-gray-400 mb-2">{field.description}</p>
            <input
              type={field.type}
              step="any"
              value={config[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
            />
          </div>
        ))}

        {message && (
          <div
            className={`px-4 py-2.5 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
