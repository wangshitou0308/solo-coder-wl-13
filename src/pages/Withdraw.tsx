import { useState, useEffect } from 'react';
import { ArrowUpRight, Wallet, Info, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Transaction, PaginatedResponse, PlatformConfig } from '@/types';

export default function Withdraw() {
  const { user, fetchUser } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [minAmount, setMinAmount] = useState(10);
  const [records, setRecords] = useState<Transaction[]>([]);

  useEffect(() => {
    api.get<PlatformConfig>('/admin/config').then((res) => {
      if (res.code === 0 && res.data) {
        setMinAmount(Number(res.data.min_withdraw_amount) || 10);
      }
    });
    api
      .get<PaginatedResponse<Transaction>>('/user/transactions?page=1&page_size=20')
      .then((res) => {
        if (res.code === 0 && res.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          setRecords(list.filter((t) => t.type === 'withdraw'));
        }
      });
  }, []);

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('请输入有效金额');
      return;
    }
    if (val < minAmount) {
      setError(`最低提现金额为 ¥${minAmount}`);
      return;
    }
    if (val > (user?.balance ?? 0)) {
      setError('余额不足');
      return;
    }
    if (!paymentMethod.trim()) {
      setError('请输入收款方式');
      return;
    }
    if (!paymentAccount.trim()) {
      setError('请输入收款账号');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/user/withdraw', {
        amount: val,
        payment_method: paymentMethod,
        payment_account: paymentAccount,
      });
      if (res.code === 0) {
        setSuccess('提现申请已提交');
        setAmount('');
        setPaymentMethod('');
        setPaymentAccount('');
        fetchUser();
      } else {
        setError(res.message || '提现失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={14} className="text-green-500" />;
    if (status === 'pending') return <Clock size={14} className="text-orange-400" />;
    return <XCircle size={14} className="text-red-400" />;
  };

  const statusText: Record<string, string> = {
    completed: '已完成',
    pending: '处理中',
    failed: '失败',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
        <p className="text-orange-100 text-sm">可提现余额</p>
        <p className="text-3xl font-bold mt-1">¥{user?.balance?.toFixed(2) ?? '0.00'}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">提现金额</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); setSuccess(''); }}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-lg font-medium transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">收款方式</label>
          <input
            type="text"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="如：支付宝、微信、银行卡"
            className="w-full px-4 py-3 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">收款账号</label>
          <input
            type="text"
            value={paymentAccount}
            onChange={(e) => setPaymentAccount(e.target.value)}
            placeholder="请输入对应的账号信息"
            className="w-full px-4 py-3 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
          />
        </div>

        <div className="flex items-start gap-2 bg-orange-50 rounded-xl p-3">
          <Info size={16} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-600">最低提现金额为 ¥{minAmount}，提现将在1-3个工作日内到账</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ArrowUpRight size={18} />
          {submitting ? '提交中...' : '申请提现'}
        </button>
      </div>

      {records.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-border">
            <h3 className="text-sm font-medium text-gray-700">最近提现记录</h3>
          </div>
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-warm-border last:border-b-0"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Wallet size={16} className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">提现 ¥{r.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(r.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {statusIcon(r.status)}
                <span className="text-xs text-gray-500">{statusText[r.status] || r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
