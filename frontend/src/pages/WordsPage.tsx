import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentWords, getLearningWords, getMasteredWords, getRecentGroups, getLearningGroups, getGroupWords, getWord } from '../api';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import WordCard from '../components/WordCard';

type Tab = 'recent' | 'learning' | 'mastered';
type SubTab = 'groups' | 'words';

interface WordItem {
  id: number;
  english: string;
  chinese: string;
  stage?: number;
  next_review?: string;
  studied_at?: string;
}

interface GroupItem {
  id: number;
  name: string;
  word_count: number;
  learning_count?: number;
  created_at: string;
}

export default function WordsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('recent');
  const [subTab, setSubTab] = useState<SubTab>('groups');
  const [words, setWords] = useState<WordItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [groupWords, setGroupWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardWord, setCardWord] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setExpandedGroup(null);
    setGroupWords([]);
    if (subTab === 'words' || tab === 'mastered') {
      const fn = tab === 'recent' ? getRecentWords : tab === 'learning' ? getLearningWords : getMasteredWords;
      fn().then((res) => setWords(res.data)).finally(() => setLoading(false));
    } else {
      const fn = tab === 'recent' ? getRecentGroups : getLearningGroups;
      fn().then((res) => setGroups(res.data)).finally(() => setLoading(false));
    }
  }, [tab, subTab]);

  const handleGroupClick = async (groupId: number) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setGroupWords([]);
      return;
    }
    setExpandedGroup(groupId);
    const res = await getGroupWords(groupId);
    setGroupWords(res.data);
  };

  const handleWordClick = async (id: number) => {
    try {
      const res = await getWord(id);
      setCardWord(res.data);
      setCardOpen(true);
    } catch {}
  };

  const handleStudyGroup = (groupId: number) => {
    getGroupWords(groupId).then((res) => {
      if (res.data.length > 0) {
        navigate('/learn/session', { state: { words: res.data, isFirst: false } });
      }
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'recent', label: '最近' },
    { key: 'learning', label: '在学' },
    { key: 'mastered', label: '已掌握' },
  ];

  const showSubTab = tab !== 'mastered';

  const renderWordList = (list: WordItem[]) => (
    <div className="space-y-2">
      {list.map((w) => (
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
  );

  const renderGroupList = () => (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.id}>
          <div className="bg-white rounded-xl p-3 flex justify-between items-center">
            <div className="flex-1 cursor-pointer" onClick={() => handleGroupClick(g.id)}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{expandedGroup === g.id ? '▼' : '▶'}</span>
                <p className="text-base font-medium text-gray-900">{g.name}</p>
              </div>
              <p className="text-xs text-gray-400 ml-5">
                {g.word_count}个词 · {new Date(g.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              className="text-sm text-blue-500 px-3 py-1"
              onClick={(e) => { e.stopPropagation(); handleStudyGroup(g.id); }}
            >
              学习
            </button>
          </div>
          {expandedGroup === g.id && groupWords.length > 0 && (
            <div className="ml-4 mt-1 space-y-1">
              {groupWords.map((w) => (
                <div
                  key={w.id}
                  className="bg-gray-50 rounded-lg p-2 flex justify-between items-center cursor-pointer"
                  onClick={() => handleWordClick(w.id)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{w.english}</p>
                    <p className="text-xs text-gray-400">{w.chinese}</p>
                  </div>
                  {w.stage !== undefined && (
                    <span className="text-xs text-blue-400">第{w.stage}轮</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

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
      {showSubTab && (
        <div className="flex gap-2 px-4 pt-2">
          <button
            className={`px-3 py-1 text-sm rounded-full ${subTab === 'groups' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setSubTab('groups')}
          >
            组
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${subTab === 'words' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setSubTab('words')}
          >
            单词
          </button>
        </div>
      )}
      <div className="px-4 pt-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10">加载中...</p>
        ) : (subTab === 'groups' && showSubTab) ? (
          groups.length === 0 ? (
            <p className="text-center text-gray-400 py-10">暂无学习组</p>
          ) : renderGroupList()
        ) : (
          words.length === 0 ? (
            <p className="text-center text-gray-400 py-10">暂无单词</p>
          ) : renderWordList(words)
        )}
      </div>
      <WordCard word={cardWord} open={cardOpen} onClose={() => setCardOpen(false)} />
      <TabBar />
    </div>
  );
}
