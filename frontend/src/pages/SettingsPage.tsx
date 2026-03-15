import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWordBanks, getWord } from '../api';
import api from '../api/client';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import Button from '../components/Button';
import WordCard from '../components/WordCard';

interface Bank {
  id: number;
  name: string;
  total: number;
  learned: number;
}

const DEFAULT_INTERVALS = '1,2,4,7,15,30';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [groupSize, setGroupSize] = useState(user?.group_size || 10);
  const [intervals, setIntervals] = useState<number[]>([]);
  const [editingIntervals, setEditingIntervals] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingIntervals, setSavingIntervals] = useState(false);
  const [expandedBank, setExpandedBank] = useState<number | null>(null);
  const [bankWords, setBankWords] = useState<{ id: number; english: string; chinese: string; status: string | null }[]>([]);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardWord, setCardWord] = useState<any>(null);
  const [loadingWordIds, setLoadingWordIds] = useState<Set<number>>(new Set());
  const [showBanks, setShowBanks] = useState(false);

  useEffect(() => {
    getWordBanks().then((res) => setBanks(res.data));
  }, []);

  useEffect(() => {
    const str = user?.review_intervals || DEFAULT_INTERVALS;
    setIntervals(str.split(',').map(Number));
  }, [user]);

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

  const handleIntervalChange = (index: number, value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return;
    const newIntervals = [...intervals];
    newIntervals[index] = num;
    setIntervals(newIntervals);
  };

  const handleAddInterval = () => {
    const last = intervals[intervals.length - 1] || 0;
    setIntervals([...intervals, last + 7]);
  };

  const handleRemoveInterval = (index: number) => {
    if (intervals.length <= 1) return;
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const handleSaveIntervals = async () => {
    const sorted = [...intervals].sort((a, b) => a - b);
    setSavingIntervals(true);
    try {
      await api.put('/users/settings', { review_intervals: sorted.join(',') });
      await refreshUser();
      setEditingIntervals(false);
      alert('保存成功');
    } catch (err: any) {
      alert(err?.response?.data?.detail || '保存失败');
    } finally {
      setSavingIntervals(false);
    }
  };

  const handleResetIntervals = () => {
    setIntervals(DEFAULT_INTERVALS.split(',').map(Number));
  };

  const handleBankClick = async (bankId: number) => {
    if (expandedBank === bankId) {
      setExpandedBank(null);
      setBankWords([]);
      return;
    }
    setExpandedBank(bankId);
    const res = await api.get(`/words/bank/${bankId}`);
    setBankWords(res.data);
  };

  const handleWordClick = async (wordId: number) => {
    if (loadingWordIds.has(wordId)) return;
    if (loadingWordIds.size >= 10) return;
    setLoadingWordIds((prev) => new Set(prev).add(wordId));
    try {
      const res = await getWord(wordId);
      setCardWord(res.data);
      setCardOpen(true);
      if (res.data.chinese) {
        setBankWords((prev) => prev.map((w) => w.id === wordId ? { ...w, chinese: res.data.chinese } : w));
      }
    } finally {
      setLoadingWordIds((prev) => { const s = new Set(prev); s.delete(wordId); return s; });
    }
  };

  return (
    <div className={cardOpen ? "pb-64" : "pb-20"}>
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
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-400">记忆曲线（天）</h3>
            {!editingIntervals ? (
              <button className="text-xs text-blue-500" onClick={() => setEditingIntervals(true)}>编辑</button>
            ) : (
              <button className="text-xs text-gray-400" onClick={() => { setEditingIntervals(false); const str = user?.review_intervals || DEFAULT_INTERVALS; setIntervals(str.split(',').map(Number)); }}>取消</button>
            )}
          </div>
          {!editingIntervals ? (
            <div className="flex flex-wrap gap-2">
              {intervals.map((val, i) => (
                <span key={i} className="bg-gray-50 rounded-lg px-3 py-1 text-sm text-gray-700">第{val}天</span>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-300">学完后第 N 天复习，递增排列</p>
              <div className="flex flex-wrap gap-2">
                {intervals.map((val, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      value={val}
                      onChange={(e) => handleIntervalChange(i, e.target.value)}
                      className="w-12 text-center text-sm bg-transparent outline-none"
                    />
                    {intervals.length > 1 && (
                      <button className="text-gray-300 text-xs" onClick={() => handleRemoveInterval(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button
                  className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg text-gray-400 text-lg"
                  onClick={handleAddInterval}
                >+</button>
              </div>
              <div className="flex gap-2">
                <Button size="md" onClick={handleSaveIntervals} disabled={savingIntervals}>
                  {savingIntervals ? '保存中...' : '保存'}
                </Button>
                <Button size="md" variant="ghost" onClick={handleResetIntervals}>重置默认</Button>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowBanks(!showBanks)}>
            <span className={`text-xs text-gray-400 inline-block transition-transform ${showBanks ? 'rotate-90' : ''}`}>▶</span>
            <h3 className="text-sm font-medium text-gray-400">词库</h3>
          </div>
          {showBanks && banks.map((b) => (
            <div key={b.id} className="py-2 border-b border-gray-50 last:border-0">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => handleBankClick(b.id)}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs text-gray-400 inline-block transition-transform ${expandedBank === b.id ? 'rotate-90' : ''}`}>▶</span>
                  <span className="text-base text-gray-700">{b.name}</span>
                </div>
                <span className="text-xs text-gray-400">{b.learned}/{b.total}</span>
              </div>
              {b.total > 0 && (
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-5">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${Math.round((b.learned / b.total) * 100)}%` }}
                  />
                </div>
              )}
              {expandedBank === b.id && bankWords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
                  {bankWords.map((w) => {
                    const hasInfo = !!w.chinese;
                    const isLoading = loadingWordIds.has(w.id);
                    return (
                      <span
                        key={w.id}
                        className={`text-xs rounded px-1.5 py-0.5 cursor-pointer transition ${
                          isLoading
                            ? 'bg-blue-100 text-blue-400 animate-pulse'
                            : w.status === 'mastered'
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : w.status === 'learning'
                                ? 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                                : hasInfo
                                  ? 'text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-500'
                                  : 'text-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleWordClick(w.id)}
                      >
                        {w.english}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <WordCard word={cardWord} open={cardOpen} onClose={() => setCardOpen(false)} playOnClick={false} />
      <TabBar />
    </div>
  );
}
