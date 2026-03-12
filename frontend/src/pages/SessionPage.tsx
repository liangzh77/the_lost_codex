import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, confirmDone } from '../api';
import NavBar from '../components/NavBar';
import Button from '../components/Button';
import WordCard from '../components/WordCard';

interface WordInfo {
  id: number;
  english: string;
  chinese: string;
  phonetic: string;
  chinese_explanation: string;
  english_explanation: string;
  example_sentence: string;
}

interface Quiz {
  word_id: number;
  quiz_type: string;
  question: string;
  options: string[];
  correct_answer: string;
}

type Phase = 'first_look' | 'quiz' | 'done';

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { words, isFirst } = (location.state || {}) as { words: WordInfo[]; isFirst: boolean };

  const [phase, setPhase] = useState<Phase>(isFirst ? 'first_look' : 'quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cardWord, setCardWord] = useState<WordInfo | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  // 没有单词数据时返回
  useEffect(() => {
    if (!words || words.length === 0) navigate('/home');
  }, [words, navigate]);

  // 加载测试题
  useEffect(() => {
    if (phase === 'quiz' && words && currentIndex < words.length) {
      loadQuiz(words[currentIndex].id);
    }
  }, [phase, currentIndex]);

  const loadQuiz = async (wordId: number) => {
    setSelected(null);
    setShowResult(false);
    const res = await getQuiz(wordId);
    setQuiz(res.data);
  };

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('done');
    }
  };

  const handleFirstLookNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 第一轮浏览完，进入测试
      setCurrentIndex(0);
      setPhase('quiz');
    }
  };

  const handleAgain = () => {
    setCurrentIndex(0);
    setPhase('quiz');
  };

  const handleConfirmDone = async () => {
    await confirmDone(words.map((w) => w.id));
    navigate('/home');
  };

  const showWordCard = (word: WordInfo) => {
    setCardWord(word);
    setCardOpen(true);
  };

  if (!words || words.length === 0) return null;

  // 第一次学习：展示完整信息
  if (phase === 'first_look') {
    const word = words[currentIndex];
    return (
      <div className="pb-6">
        <NavBar title={`认识新词 ${currentIndex + 1}/${words.length}`} onBack={() => navigate('/home')} />
        <div className="px-4 pt-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-3">
            <h2 className="text-3xl font-bold text-gray-900">{word.english}</h2>
            <p className="text-sm text-gray-400">{word.phonetic}</p>
            <p className="text-xl text-gray-700">{word.chinese}</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-left space-y-1">
              <p><span className="text-gray-400">中文释义：</span>{word.chinese_explanation}</p>
              <p><span className="text-gray-400">英文释义：</span>{word.english_explanation}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-600 italic">
              {word.example_sentence}
            </div>
          </div>
          <Button size="lg" onClick={handleFirstLookNext}>
            {currentIndex < words.length - 1 ? '下一个' : '开始测试'}
          </Button>
        </div>
      </div>
    );
  }

  // 测试完成
  if (phase === 'done') {
    return (
      <div className="pb-6">
        <NavBar title="学习完成" />
        <div className="px-4 pt-10 space-y-4 text-center">
          <p className="text-5xl">🎉</p>
          <p className="text-lg text-gray-700">这组单词你已经过了一遍</p>
          <p className="text-sm text-gray-400">可以再练一次，或确认学完</p>
          <div className="space-y-3 pt-4">
            <Button size="lg" variant="secondary" onClick={handleAgain}>再练一次</Button>
            <Button size="lg" onClick={handleConfirmDone}>学完了</Button>
          </div>
        </div>
      </div>
    );
  }

  // 测试阶段
  const word = words[currentIndex];
  return (
    <div className="pb-6">
      <NavBar
        title={`测试 ${currentIndex + 1}/${words.length}`}
        onBack={() => navigate('/home')}
      />
      <div className="px-4 pt-6 space-y-4">
        {quiz && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-2">
                {quiz.quiz_type === 'cn_to_en' ? '选出对应的英文' :
                 quiz.quiz_type === 'en_to_cn' ? '选出对应的中文' : '选出中文释义'}
              </p>
              <h2
                className="text-2xl font-bold text-gray-900 cursor-pointer"
                onClick={() => showWordCard(word)}
              >
                {quiz.question}
              </h2>
              <p className="text-xs text-gray-300 mt-1">点击可查看详情</p>
            </div>
            <div className="space-y-2">
              {quiz.options.map((opt, i) => {
                let cls = 'bg-white border-2 border-gray-100';
                if (showResult) {
                  if (opt === quiz.correct_answer) cls = 'bg-green-50 border-2 border-green-400';
                  else if (opt === selected && opt !== quiz.correct_answer) cls = 'bg-red-50 border-2 border-red-400';
                }
                return (
                  <button
                    key={i}
                    className={`w-full rounded-xl p-4 text-left text-base transition ${cls}`}
                    onClick={() => handleSelect(opt)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {showResult && (
              <Button size="lg" onClick={handleNext}>
                {currentIndex < words.length - 1 ? '下一题' : '完成'}
              </Button>
            )}
          </>
        )}
      </div>
      <WordCard word={cardWord} open={cardOpen} onClose={() => setCardOpen(false)} />
    </div>
  );
}
