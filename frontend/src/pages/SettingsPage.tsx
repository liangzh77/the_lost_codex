import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWordBanks } from '../api';
import api from '../api/client';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import Button from '../components/Button';

interface Bank {
  id: number;
  name: string;
  total: number;
  learned: number;
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [groupSize, setGroupSize] = useState(user?.group_size || 10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWordBanks().then((res) => setBanks(res.data));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/settings', { group_size: groupSize });
      await refreshUser();
      alert('保存成功');
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-20">
      <NavBar title="设置" />
      <div className="px-4 pt-4 space-y-6">
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">每组单词数量</h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={3}
              max={30}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-bold text-gray-900 w-8 text-center">{groupSize}</span>
          </div>
          <Button size="md" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">可用词库</h3>
          {banks.map((b) => (
            <div key={b.id} className="py-2 border-b border-gray-50 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-700">{b.name}</span>
                <span className="text-xs text-gray-400">{b.learned}/{b.total}</span>
              </div>
              {b.total > 0 && (
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${Math.round((b.learned / b.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-2">账号：{user?.username}</p>
          <Button size="md" variant="ghost" onClick={logout}>退出登录</Button>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
