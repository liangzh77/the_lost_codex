import { useEffect, useState } from 'react';
import { getRecentWords, getLearningWords, getMasteredWords } from '../api';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import WordCard from '../components/WordCard';
import { getWord } from '../api';

type Tab = 'recent' | 'learning' | 'mastered';

interface WordItem {
  id: number;
  english: string;
  chinese: string;
  stage?: number;
  next_review?: string;
  studied_at?: string;
}

export default function WordsPage() {
  const [tab, setTab] = useState<Tab>('recent');
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardWord, setCardWord] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const fn = tab === 'recent' ? getRecentWords : tab === 'learning' ? getLearningWords : getMasteredWords;
    fn().then((res) => setWords(res.data)).finally(() => setLoading(false));
  }, [tab]);

  const handleWordClick = async (id: number) => {
    try {
      const res = await getWord(id);
      setCardWord(res.data);
      setCardOpen(true);
    } catch (err) {
      console.error('获取单词详情失败', err);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'recent', label: '最近' },
    { key: 'learning', label: '在学' },
    { key: 'mastered', label: '已掌握' },
  ];

  return (
    <div className="pb-20">
      <NavBar title="单词" />
      <div className="flex border-b border-gray-100 bg-white">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`flex-1 py-2.5 text-sm font-medium transition ${tab === t.key ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-4 pt-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10">加载中...</p>
        ) : words.length === 0 ? (
          <p className="text-center text-gray-400 py-10">暂无单词</p>
        ) : (
          <div className="space-y-2">
            {words.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-xl p-3 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => handleWordClick(w.id)}
              >
                <div>
                  <p className="text-base font-medium text-gray-900">{w.english}</p>
                  <p className="text-sm text-gray-400">{w.chinese}</p>
                </div>
                {tab === 'learning' && w.stage !== undefined && (
                  <span className="text-xs text-blue-400 bg-blue-50 px-2 py-1 rounded-lg">
                    第{w.stage}轮
                  </span>
                )}
                {tab === 'recent' && w.studied_at && (
                  <span className="text-xs text-gray-300">
                    {new Date(w.studied_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <WordCard word={cardWord} open={cardOpen} onClose={() => setCardOpen(false)} />
      <TabBar />
    </div>
  );
}
