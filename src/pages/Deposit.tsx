import { useState } from 'react';
import { ArrowDownRight, Wallet, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

export default function Deposit() {
  const { user, fetchUser } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const quickAmounts = [10, 50, 100, 200, 500];

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('请输入有效金额');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/users/me/credit', { amount: val });
      if (res.code === 0) {
        setSuccess(`成功充值 ¥${val.toFixed(2)}`);
        setAmount('');
        fetchUser();
      } else {
        setError(res.message || '充值失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
        <p className="text-orange-100 text-sm">当前余额</p>
        <p className="text-3xl font-bold mt-1">¥{user?.balance?.toFixed(2) ?? '0.00'}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">充值金额</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); setSuccess(''); }}
              placeholder="0.00"
              min="1"
              step="0.01"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-lg font-medium transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">快捷金额</label>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map((val) => (
              <button
                key={val}
                onClick={() => { setAmount(String(val)); setError(''); setSuccess(''); }}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  amount === String(val)
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-600 border-warm-border hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                ¥{val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 bg-orange-50 rounded-xl p-3">
          <Info size={16} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-600">充值即时到账，虚拟积分可用于平台任务悬赏</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !amount}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ArrowDownRight size={18} />
          {submitting ? '充值中...' : '确认充值'}
        </button>
      </div>
    </div>
  );
}
