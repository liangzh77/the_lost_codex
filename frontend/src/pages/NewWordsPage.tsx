import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWordBanks, startNewWords } from '../api';
import NavBar from '../components/NavBar';
import Button from '../components/Button';
import Card from '../components/Card';

interface Bank {
  id: number;
  name: string;
}

export default function NewWordsPage() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWordBanks().then((res) => setBanks(res.data));
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      let res;
      if (customMode) {
        const words = customInput.split(/[,，\s\n]+/).filter(Boolean);
        if (words.length === 0) return;
        res = await startNewWords(undefined, words);
      } else {
        if (!selectedBank) return;
        res = await startNewWords(selectedBank);
      }
      if (res.data.length === 0) {
        alert('没有找到新单词');
        return;
      }
      navigate('/learn/session', { state: { words: res.data, isFirst: true } });
    } finally {
      setLoading(false);
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
                <p className="text-base text-gray-900">{bank.name}</p>
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
          {loading ? '加载中...' : '开始学习'}
        </Button>
      </div>
    </div>
  );
}
