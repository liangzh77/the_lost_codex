import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, confirmDone } from '../api';
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
  const [showCard, setShowCard] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [quizType, setQuizType] = useState<string>(() => {
    const types = ['cn_to_en', 'en_to_cn', 'en_to_explanation'];
    return types[Math.floor(Math.random() * types.length)];
  });

  useEffect(() => {
    if (!words || words.length === 0) navigate('/home');
  }, [words, navigate]);

  useEffect(() => {
    if (phase === 'quiz' && words && currentIndex < words.length) {
      loadQuiz(words[currentIndex].id, quizType);
    }
  }, [phase, currentIndex, quizType]);

  const loadQuiz = async (wordId: number, type: string) => {
    setSelected(null);
    setShowResult(false);
    setShowCard(false);
    setQuizLoading(true);
    try {
      const res = await getQuiz(wordId, type);
      setQuiz(res.data);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    setTotalCount((c) => c + 1);
    if (option === quiz?.correct_answer) {
      setCorrectCount((c) => c + 1);
    }
    setShowCard(true);
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
      setCurrentIndex(0);
      setPhase('quiz');
    }
  };

  const handleAgain = (type: string) => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setTotalCount(0);
    setShowCard(false);
    setQuizType(type);
    setPhase('quiz');
  };

  const handleConfirmDone = async () => {
    await confirmDone(words.map((w) => w.id));
    navigate('/home');
  };

  if (!words || words.length === 0) return null;

  const word = words[currentIndex];

  // 底部单词卡片（非模态，不遮挡）
  const bottomCard = showCard && word && (
    <div className="border-t border-gray-100 bg-white p-4 space-y-2">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">{word.english}</h3>
        <p className="text-xs text-gray-400">{word.phonetic}</p>
      </div>
      <div className="text-center text-lg text-gray-700">{word.chinese}</div>
      <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
        <div><span className="text-gray-400">中文释义：</span><span className="text-gray-700">{word.chinese_explanation}</span></div>
        <div><span className="text-gray-400">英文释义：</span><span className="text-gray-700">{word.english_explanation}</span></div>
      </div>
      <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-600 italic">
        {word.example_sentence}
      </div>
    </div>
  );

  // 第一次学习：展示完整信息
  if (phase === 'first_look') {
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
          {totalCount > 0 && (
            <p className="text-sm text-gray-500">
              正确率：{correctCount}/{totalCount}（{Math.round((correctCount / totalCount) * 100)}%）
            </p>
          )}
          <p className="text-sm text-gray-400">选择一种方式再练一次，或确认学完</p>
          <div className="space-y-3 pt-4">
            <Button size="lg" variant="secondary" onClick={() => handleAgain('cn_to_en')}>中文 → 选英文</Button>
            <Button size="lg" variant="secondary" onClick={() => handleAgain('en_to_cn')}>英文 → 选中文</Button>
            <Button size="lg" variant="secondary" onClick={() => handleAgain('en_to_explanation')}>英文 → 选中文释义</Button>
            <Button size="lg" onClick={handleConfirmDone}>学完了</Button>
          </div>
        </div>
      </div>
    );
  }

  // 测试阶段
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar
        title={`测试 ${currentIndex + 1}/${words.length}`}
        onBack={() => navigate('/home')}
      />
      <div className="flex-1 px-4 pt-6 space-y-4">
        {quizLoading ? (
          <p className="text-center text-gray-400 py-10">加载中...</p>
        ) : quiz && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-2">
                {quiz.quiz_type === 'cn_to_en' ? '选出对应的英文' :
                 quiz.quiz_type === 'en_to_cn' ? '选出对应的中文' : '选出中文释义'}
              </p>
              <h2
                className="text-2xl font-bold text-gray-900 cursor-pointer"
                onClick={() => setShowCard(true)}
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
      {bottomCard}
    </div>
  );
}
