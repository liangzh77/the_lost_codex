import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWordBanks, startNewWords, startNewSingleWord, checkWords } from '../api';
import NavBar from '../components/NavBar';
import Button from '../components/Button';
import Card from '../components/Card';

interface Bank {
  id: number;
  name: string;
  total: number;
  learned: number;
}

export default function NewWordsPage() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, word: '' });

  useEffect(() => {
    getWordBanks().then((res) => setBanks(res.data));
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      if (customMode) {
        const wordList = customInput.split(/[,，\s\n]+/).filter(Boolean);
        if (wordList.length === 0) return;
        // 先检查哪些是新词
        const checkRes = await checkWords(wordList);
        const existingWords: string[] = checkRes.data.existing;
        const newWords: string[] = checkRes.data.new;
        const allWords: any[] = [];
        // 已有的词批量获取
        if (existingWords.length > 0) {
          const res = await startNewWords(undefined, existingWords);
          allWords.push(...res.data);
        }
        // 新词逐个加载，显示进度
        if (newWords.length > 0) {
          setProgress({ current: 0, total: newWords.length, word: '' });
          for (let i = 0; i < newWords.length; i++) {
            setProgress({ current: i + 1, total: newWords.length, word: newWords[i] });
            try {
              const res = await startNewSingleWord(newWords[i]);
              if (res.data.length > 0) allWords.push(...res.data);
            } catch {}
          }
        }
        if (allWords.length === 0) {
          alert('没有找到新单词');
          return;
        }
        navigate('/learn/session', { state: { words: allWords, isFirst: true } });
      } else {
        if (!selectedBank) return;
        const res = await startNewWords(selectedBank);
        if (res.data.length === 0) {
          alert('没有找到新单词');
          return;
        }
        navigate('/learn/session', { state: { words: res.data, isFirst: true } });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '请求失败';
      alert(msg);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, word: '' });
    }
  };

  return (
    <div className="pb-6">
      <NavBar title="学习新词" onBack={() => navigate('/home')} />
      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!customMode ? 'primary' : 'secondary'}
            onClick={() => setCustomMode(false)}
          >
            从词库选择
          </Button>
          <Button
            size="sm"
            variant={customMode ? 'primary' : 'secondary'}
            onClick={() => setCustomMode(true)}
          >
            自定义输入
          </Button>
        </div>

        {!customMode ? (
          <div className="space-y-2">
            {banks.map((bank) => (
              <Card
                key={bank.id}
                className={`border-2 ${selectedBank === bank.id ? 'border-blue-500' : 'border-transparent'}`}
                onClick={() => setSelectedBank(bank.id)}
              >
                <div className="flex justify-between items-center">
                  <p className="text-base text-gray-900">{bank.name}</p>
                  <p className="text-xs text-gray-400">{bank.learned}/{bank.total}</p>
                </div>
                {bank.total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.round((bank.learned / bank.total) * 100)}%` }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <textarea
            className="w-full h-32 px-4 py-3 bg-white rounded-xl border border-gray-200 text-base outline-none focus:border-blue-400 resize-none"
            placeholder="输入单词，用逗号或换行分隔"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
        )}

        <Button
          size="lg"
          onClick={handleStart}
          disabled={loading || (!customMode && !selectedBank) || (customMode && !customInput.trim())}
        >
          {loading && progress.total > 0
            ? `加载中 ${progress.current}/${progress.total}：${progress.word}`
            : loading ? '加载中...' : '开始学习'}
        </Button>

        {loading && progress.total > 0 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
