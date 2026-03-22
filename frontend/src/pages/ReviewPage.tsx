import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTodayReview } from '../api';
import NavBar from '../components/NavBar';
import Button from '../components/Button';

interface WordInfo {
  id: number;
  english: string;
  chinese: string;
  phonetic: string;
  chinese_explanation: string;
  english_explanation: string;
  example_sentence: string;
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preloaded = (location.state as { words?: WordInfo[] } | null)?.words ?? null;
  const [words, setWords] = useState<WordInfo[] | null>(preloaded);

  useEffect(() => {
    if (preloaded) return;
    getTodayReview().then((res) => {
      if (res.data.length === 0) {
        alert('今天没有需要复习的单词');
        navigate('/home');
      } else {
        setWords(res.data);
      }
    });
  }, [navigate, preloaded]);

  if (!words) {
    return (
      <div>
        <NavBar title="复习" onBack={() => navigate('/home')} />
        <div className="flex items-center justify-center h-60 text-gray-400">加载中...</div>
      </div>
    );
  }

  const goSession = (quizType: string) => {
    navigate('/learn/session', { state: { words, isFirst: false, initialQuizType: quizType } });
  };

  return (
    <div className="pb-6">
      <NavBar title="题型选择" onBack={() => navigate('/home')} />
      <div className="px-4 pt-10 space-y-4 text-center">
        <p className="text-sm text-gray-500">共 {words.length} 个单词待复习</p>
        <p className="text-sm text-gray-400">选择一种题型开始复习</p>
        <div className="space-y-3 pt-4">
          <Button size="lg" variant="secondary" onClick={() => goSession('cn_to_en')}>中文 → 选英文</Button>
          <Button size="lg" variant="secondary" onClick={() => goSession('en_to_cn')}>英文 → 选中文</Button>
          <Button size="lg" variant="secondary" onClick={() => goSession('en_to_explanation')}>英文 → 选中文释义</Button>
          <Button size="lg" variant="secondary" onClick={() => goSession('spelling')}>中文 → 拼写英文</Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/game', { state: { reviewWords: words } })}>⚔️ 单词战场</Button>
        </div>
      </div>
    </div>
  );
}
