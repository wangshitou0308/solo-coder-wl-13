import { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

export default function AccountSettings() {
  const { user, fetchUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/users/me', {
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
      });
      if (res.code === 0) {
        setSuccess('个人信息已更新');
        fetchUser();
      } else {
        setError(res.message || '更新失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError('请填写完整密码信息');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('新密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('两次密码不一致');
      return;
    }
    setPwdSaving(true);
    setPwdError('');
    try {
      const res = await api.put('/users/me/password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (res.code === 0) {
        setPwdSuccess('密码已修改');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdError(res.message || '修改密码失败');
      }
    } catch {
      setPwdError('网络错误，请重试');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <User size={18} className="text-orange-500" />
          基本信息
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">头像链接</label>
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="输入头像图片URL"
            className="w-full px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
          />
          {avatar && (
            <div className="mt-2 flex items-center gap-3">
              <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-warm-border" />
              <span className="text-xs text-gray-400">头像预览</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500 flex items-center gap-1"><CheckCircle size={14} />{success}</p>}

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存修改'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MapPin size={18} className="text-orange-500" />
          修改密码
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">当前密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入当前密码"
            className="w-full px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码（至少6位）"
            className="w-full px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入新密码"
            className="w-full px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm transition-all"
          />
        </div>

        {pwdError && <p className="text-sm text-red-500">{pwdError}</p>}
        {pwdSuccess && <p className="text-sm text-green-500 flex items-center gap-1"><CheckCircle size={14} />{pwdSuccess}</p>}

        <button
          onClick={handleChangePassword}
          disabled={pwdSaving}
          className="w-full py-3 bg-white text-orange-500 border border-orange-300 hover:bg-orange-50 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {pwdSaving ? '修改中...' : '修改密码'}
        </button>
      </div>
    </div>
  );
}
