import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, confirmDone, getGrowthStats } from '../api';
import NavBar from '../components/NavBar';
import Button from '../components/Button';
import WordCard from '../components/WordCard';
import { diffSpelling } from '../utils/diffSpelling';

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
  const [spellingCorrect, setSpellingCorrect] = useState(0);
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingSubmitted, setSpellingSubmitted] = useState(false);
  const spellingRef = useRef<HTMLInputElement>(null);
  const imprintBarRef = useRef<HTMLSpanElement>(null);
  // 用 ref 保存最新计数，确保 handleConfirmDone 能拿到最新值
  const countsRef = useRef({ totalCount: 0, correctCount: 0, spellingCorrect: 0 });
  const [todayImprints, setTodayImprints] = useState(0);
  const [totalImprints, setTotalImprints] = useState(0);
  const [imprintBounce, setImprintBounce] = useState(false);

  useEffect(() => {
    getGrowthStats().then((r) => {
      setTodayImprints(r.data.today_imprints);
      setTotalImprints(r.data.total_imprints);
    });
  }, []);

  const flyImprint = useCallback((sourceEl: HTMLElement | null, amount: number) => {
    if (!sourceEl || !imprintBarRef.current) return;
    const src = sourceEl.getBoundingClientRect();
    const dst = imprintBarRef.current.getBoundingClientRect();
    const startX = src.left + src.width / 2;
    const startY = src.top + src.height / 2;
    const endX = dst.left + dst.width / 2;
    const endY = dst.top + dst.height / 2;

    for (let i = 0; i < amount; i++) {
      const dot = document.createElement('div');
      const delay = i * 120;
      dot.style.cssText = `
        position:fixed;z-index:9999;width:12px;height:12px;border-radius:50%;
        background:linear-gradient(135deg,#3b82f6,#60a5fa);
        box-shadow:0 0 8px rgba(59,130,246,0.6),0 0 16px rgba(59,130,246,0.3);
        left:${startX - 6}px;top:${startY - 6}px;
        pointer-events:none;opacity:1;
        animation:imprintFly 600ms ${delay}ms cubic-bezier(0.2,0.8,0.2,1) forwards;
      `;
      document.body.appendChild(dot);
      setTimeout(() => {
        dot.remove();
        setTodayImprints((c) => c + 1);
        setTotalImprints((c) => c + 1);
        setImprintBounce(true);
        setTimeout(() => setImprintBounce(false), 300);
      }, 600 + delay);
    }

    // Inject keyframes if not already
    if (!document.getElementById('imprint-fly-style')) {
      const style = document.createElement('style');
      style.id = 'imprint-fly-style';
      style.textContent = `
        @keyframes imprintFly {
          0% { transform:scale(1);opacity:1; }
          50% { transform:translate(${(endX - startX) * 0.5}px,${(endY - startY) * 0.5 - 40}px) scale(0.8);opacity:0.8; }
          100% { transform:translate(${endX - startX}px,${endY - startY}px) scale(0.3);opacity:0; }
        }
      `;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('imprint-fly-style')!;
      style.textContent = `
        @keyframes imprintFly {
          0% { transform:scale(1);opacity:1; }
          50% { transform:translate(${(endX - startX) * 0.5}px,${(endY - startY) * 0.5 - 40}px) scale(0.8);opacity:0.8; }
          100% { transform:translate(${endX - startX}px,${endY - startY}px) scale(0.3);opacity:0; }
        }
      `;
    }
  }, []);

  useEffect(() => {
    countsRef.current = { totalCount, correctCount, spellingCorrect };
  }, [totalCount, correctCount, spellingCorrect]);

  useEffect(() => {
    if (!words || words.length === 0) navigate('/home');
  }, [words, navigate]);

  useEffect(() => {
    if (phase === 'quiz' && words && currentIndex < words.length) {
      if (quizType === 'spelling') {
        setSpellingInput('');
        setSpellingSubmitted(false);
        setShowCard(false);
        setTimeout(() => spellingRef.current?.focus(), 100);
      } else {
        loadQuiz(words[currentIndex].id, quizType);
      }
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

  const handleSelect = (option: string, e?: React.MouseEvent) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    setTotalCount((c) => c + 1);
    if (option === quiz?.correct_answer) {
      setCorrectCount((c) => c + 1);
      if (e) flyImprint(e.currentTarget as HTMLElement, 1);
    }
    setShowCard(true);
  };

  const handleSpellingInput = (value: string) => {
    setSpellingInput(value);
    if (!spellingSubmitted && value.toLowerCase().trim() === word?.english.toLowerCase()) {
      setSpellingSubmitted(true);
      setTotalCount((c) => c + 1);
      setSpellingCorrect((c) => c + 1);
      setShowCard(true);
      flyImprint(spellingRef.current, 2);
    }
  };

  const submitSpelling = () => {
    // 如果还没提交过且输入不正确，记为答错
    if (quizType !== 'spelling' || spellingSubmitted) return;
    setSpellingSubmitted(true);
    setTotalCount((c) => c + 1);
  };

  const handlePrev = () => {
    submitSpelling();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    submitSpelling();
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
    setSpellingCorrect(0);
    setShowCard(false);
    setSpellingInput('');
    setSpellingSubmitted(false);
    setQuizType(type);
    setPhase('quiz');
  };

  const handleConfirmDone = async () => {
    submitSpelling();
    // 用 setTimeout 确保 state 更新后再读 ref
    setTimeout(async () => {
      const c = countsRef.current;
      await confirmDone(words.map((w) => w.id), c.totalCount, c.correctCount, c.spellingCorrect);
      navigate('/home');
    }, 0);
  };

  if (!words || words.length === 0) return null;

  const word = words[currentIndex];

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

  // 题型选择
  if (phase === 'done') {
    return (
      <div className="pb-6">
        <NavBar title="题型选择" onBack={() => navigate('/home')} />
        <div className="flex justify-center gap-4 py-2 bg-white/80 backdrop-blur border-b border-gray-100">
          <span className="text-xs text-gray-400">今日印记 <span className="text-sm font-bold text-blue-500">{todayImprints}</span></span>
          <span className="text-xs text-gray-400">总印记 <span className="text-sm font-bold text-gray-700">{totalImprints}</span></span>
        </div>
        <div className="px-4 pt-10 space-y-4 text-center">
          {totalCount > 0 && (
            <p className="text-sm text-gray-500">
              正确率：{correctCount}/{totalCount}（{Math.round((correctCount / totalCount) * 100)}%）
            </p>
          )}
          <p className="text-sm text-gray-400">选择一种题型继续练习</p>
          <div className="space-y-3 pt-4">
            <Button size="lg" variant="secondary" onClick={() => handleAgain('cn_to_en')}>中文 → 选英文</Button>
            <Button size="lg" variant="secondary" onClick={() => handleAgain('en_to_cn')}>英文 → 选中文</Button>
            <Button size="lg" variant="secondary" onClick={() => handleAgain('en_to_explanation')}>英文 → 选中文释义</Button>
            <Button size="lg" variant="secondary" onClick={() => handleAgain('spelling')}>中文 → 拼写英文</Button>
            <Button size="lg" onClick={handleConfirmDone}>学完了</Button>
          </div>
        </div>
      </div>
    );
  }

  // 拼写模式渲染
  const renderSpelling = () => {
    const diff = diffSpelling(spellingInput, word.english);
    const isCorrect = spellingInput.toLowerCase().trim() === word.english.toLowerCase();

    return (
      <>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-2">拼写英文</p>
          <h2
            className="text-2xl font-bold text-gray-900 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setShowCard(true); }}
          >
            {word.chinese}
          </h2>
          <p className="text-xs text-gray-300 mt-1">{word.phonetic}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap gap-0.5 min-h-[2rem] items-center justify-center">
            {diff.chars.map((c, i) => (
              <span
                key={i}
                className={`text-2xl font-mono font-bold ${
                  c.status === 'correct' ? 'text-green-500' :
                  c.status === 'wrong' ? 'text-red-500' :
                  'text-orange-400'
                }`}
              >
                {c.char}
              </span>
            ))}
            {!spellingSubmitted && <span className="text-2xl font-mono text-gray-300 animate-pulse">|</span>}
          </div>
          {spellingSubmitted && (
            <div className="text-center">
              {isCorrect ? (
                <p className="text-green-500 text-sm">正确!</p>
              ) : (
                <p className="text-sm"><span className="text-red-500">正确答案：</span><span className="text-gray-700 font-bold">{word.english}</span></p>
              )}
            </div>
          )}
          <input
            ref={spellingRef}
            type="text"
            value={spellingInput}
            onChange={(e) => { if (!spellingSubmitted) handleSpellingInput(e.target.value); }}
            className="w-full text-center text-lg py-2 border-b-2 border-gray-200 outline-none focus:border-blue-400 bg-transparent"
            placeholder="输入英文拼写..."
            autoFocus
            disabled={spellingSubmitted}
          />
        </div>
      </>
    );
  };

  // 测试阶段
  return (
    <div className="flex flex-col min-h-screen" onClick={() => setShowCard(false)}>
      <NavBar
        title={`测试 ${currentIndex + 1}/${words.length}　✓${correctCount}`}
        onBack={() => { submitSpelling(); setPhase('done'); }}
      />
      <div className="flex justify-center gap-4 py-2 bg-white/80 backdrop-blur border-b border-gray-100">
        <span className="text-xs text-gray-400">今日印记 <span ref={imprintBarRef} className={`text-sm font-bold text-blue-500 inline-block transition-transform ${imprintBounce ? 'scale-125' : 'scale-100'}`}>{todayImprints}</span></span>
        <span className="text-xs text-gray-400">总印记 <span className={`text-sm font-bold text-gray-700 inline-block transition-transform ${imprintBounce ? 'scale-110' : 'scale-100'}`}>{totalImprints}</span></span>
      </div>
      <div className="flex-1 px-4 pt-6 space-y-4">
        {quizType === 'spelling' ? (
          renderSpelling()
        ) : quizLoading ? (
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
                onClick={(e) => { e.stopPropagation(); setShowCard(true); }}
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
                    onClick={(e) => { e.stopPropagation(); handleSelect(opt, e); }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <div className="flex gap-2">
          <Button size="md" className="flex-1" variant={currentIndex > 0 ? 'primary' : 'secondary'} onClick={handlePrev} disabled={currentIndex === 0}>
            上一题
          </Button>
          <Button size="md" className="flex-1" variant={currentIndex < words.length - 1 ? 'primary' : 'secondary'} onClick={handleNext} disabled={currentIndex >= words.length - 1}>
            下一题
          </Button>
          <Button size="md" className="flex-1" variant="ghost" onClick={() => { submitSpelling(); setPhase('done'); }}>
            题型
          </Button>
          <Button size="md" className="flex-1" variant="primary" onClick={handleConfirmDone}>
            学完了
          </Button>
        </div>
      </div>
      <WordCard word={word} open={showCard} onClose={() => setShowCard(false)} />
    </div>
  );
}
