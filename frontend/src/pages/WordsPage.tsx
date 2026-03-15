import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentWords, getLearningWords, getMasteredWords, getRecentGroups, getLearningGroups, getMasteredGroups, getGroupWords, getWord } from '../api';
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
  stage?: number;
  created_at: string;
  days_until_review?: number | null;
  needs_review?: boolean;
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
    if (subTab === 'words') {
      const fn = tab === 'recent' ? getRecentWords : tab === 'learning' ? getLearningWords : getMasteredWords;
      fn().then((res) => setWords(res.data)).finally(() => setLoading(false));
    } else {
      const fn = tab === 'recent' ? getRecentGroups : tab === 'learning' ? getLearningGroups : getMasteredGroups;
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

  const handleWordClick = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const showSubTab = true;

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    // 按日历日期比较
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((todayOnly.getTime() - dateOnly.getTime()) / 86400000);
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    return `${diff}天前`;
  };

  const renderWordList = (list: WordItem[]) => (
    <div className="space-y-2">
      {list.map((w) => (
        <div
          key={w.id}
          className="bg-white rounded-xl p-3 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform"
          onClick={(e) => handleWordClick(w.id, e)}
        >
          <div>
            <p className="text-base font-medium text-gray-900">{w.english}</p>
            <p className="text-sm text-gray-400">{w.chinese}</p>
          </div>
          <div className="flex items-center gap-2">
            {w.studied_at && (
              <span className="text-xs text-gray-300">{formatTimeAgo(w.studied_at)}</span>
            )}
            {w.stage !== undefined && (
              <span className="text-xs text-blue-400 bg-blue-50 px-2 py-1 rounded-lg">
                已学{w.stage}轮
              </span>
            )}
          </div>
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
                {g.stage !== undefined && (
                  <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">已学{g.stage}轮</span>
                )}
              </div>
              <p className="text-xs text-gray-400 ml-5">
                {g.word_count}个词 · {formatTimeAgo(g.created_at)}
                {g.days_until_review != null && (
                  g.needs_review
                    ? <span className="text-red-500 ml-1">· 需要复习</span>
                    : <span className="ml-1">· {g.days_until_review}天后复习</span>
                )}
              </p>
            </div>
            {g.needs_review ? (
              <button
                className="text-sm text-white bg-blue-500 px-3 py-1 rounded-lg"
                onClick={(e) => { e.stopPropagation(); handleStudyGroup(g.id); }}
              >
                复习
              </button>
            ) : (
              <button
                className="text-sm text-blue-500 px-3 py-1"
                onClick={(e) => { e.stopPropagation(); handleStudyGroup(g.id); }}
              >
                复习
              </button>
            )}
          </div>
          {expandedGroup === g.id && groupWords.length > 0 && (
            <div className="ml-4 mt-1 space-y-1">
              {groupWords.map((w) => (
                <div
                  key={w.id}
                  className="bg-gray-50 rounded-lg p-2 flex justify-between items-center cursor-pointer"
                  onClick={(e) => handleWordClick(w.id, e)}
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
    <div className="pb-20" onClick={() => setCardOpen(false)}>
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
        <div className="flex border-b border-gray-50 bg-white">
          <button
            className={`flex-1 py-2 text-sm font-medium transition ${subTab === 'groups' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setSubTab('groups')}
          >
            组
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition ${subTab === 'words' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setSubTab('words')}
          >
            单词
          </button>
        </div>
      )}
      <div className="px-4 pt-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10">加载中...</p>
        ) : subTab === 'groups' ? (
          groups.length === 0 ? (
            <p className="text-center text-gray-400 py-10">暂无学习组</p>
          ) : renderGroupList()
        ) : (
          words.length === 0 ? (
            <p className="text-center text-gray-400 py-10">暂无单词</p>
          ) : renderWordList(words)
        )}
      </div>
      <WordCard word={cardWord} open={cardOpen} onClose={() => setCardOpen(false)} playOnClick={false} />
      <TabBar />
    </div>
  );
}
