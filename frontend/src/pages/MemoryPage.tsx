import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTodayReview, confirmDone } from '../api';
import { useImprints } from '../contexts/ImprintContext';
import NavBar from '../components/NavBar';
import Button from '../components/Button';

interface WordInfo {
  id: number;
  english: string;
  chinese: string;
}

interface MemoryCard {
  id: string;
  wordId: number;
  pairKey: string;
  content: string;
  type: 'en' | 'cn';
  state: 'hidden' | 'flipped' | 'matched';
}

type Phase = 'entry' | 'playing' | 'done';
type Difficulty = 'easy' | 'standard' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; cols: number; pairs: number; grid: string; storageKey: string }> = {
  easy:     { label: '简单', cols: 3, pairs: 6,  grid: '3×4', storageKey: 'memory_best_steps_easy' },
  standard: { label: '标准', cols: 4, pairs: 8,  grid: '4×4', storageKey: 'memory_best_steps_standard' },
  hard:     { label: '困难', cols: 4, pairs: 10, grid: '4×5', storageKey: 'memory_best_steps_hard' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBest(diff: Difficulty): number | null {
  const v = parseInt(localStorage.getItem(DIFFICULTY_CONFIG[diff].storageKey) || '0', 10);
  return v > 0 ? v : null;
}

export default function MemoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedWords = (location.state as { words?: WordInfo[] } | null)?.words ?? null;

  const [words, setWords] = useState<WordInfo[] | null>(passedWords);
  const [phase, setPhase] = useState<Phase>('entry');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [steps, setSteps] = useState(0);
  const [pairCount, setPairCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [prevBest, setPrevBest] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const { todayImprints, totalImprints, addImprints } = useImprints();
  const [imprintBounce, setImprintBounce] = useState(false);
  const doneCalledRef = useRef(false);
  const currentStepsRef = useRef(0);
  const playedWordIdsRef = useRef<number[]>([]);
  const allRevealedRef = useRef(false);
  const imprintBarRef = useRef<HTMLElement>(null);
  const sessionImprintsRef = useRef(0);

  useEffect(() => {
    if (passedWords) return;
    getTodayReview().then(res => setWords(res.data));
  }, []);

  const flyImprint = useCallback((sourceEl: HTMLElement | null, amount: number) => {
    if (!sourceEl || !imprintBarRef.current) return;
    const src = sourceEl.getBoundingClientRect();
    const dst = imprintBarRef.current.getBoundingClientRect();
    const startX = src.left + src.width / 2;
    const startY = src.top + src.height / 2;
    const endX = dst.left + dst.width / 2;
    const endY = dst.top + dst.height / 2;

    const styleId = 'imprint-fly-style';
    const keyframes = `@keyframes imprintFly {
      0% { transform:scale(1);opacity:1; }
      50% { transform:translate(${(endX - startX) * 0.5}px,${(endY - startY) * 0.5 - 40}px) scale(0.8);opacity:0.8; }
      100% { transform:translate(${endX - startX}px,${endY - startY}px) scale(0.3);opacity:0; }
    }`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
    styleEl.textContent = keyframes;

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
        addImprints(1);
        sessionImprintsRef.current += 1;
        setImprintBounce(true);
        setTimeout(() => setImprintBounce(false), 300);
      }, 600 + delay);
    }
  }, [addImprints]);

  const handleBack = () => {
    if (phase === 'playing' && !doneCalledRef.current) {
      const matchedWordIds = cards
        .filter(c => c.state === 'matched' && c.type === 'en')
        .map(c => c.wordId);
      if (matchedWordIds.length > 0 || sessionImprintsRef.current > 0) {
        const ids = matchedWordIds.length > 0 ? matchedWordIds : playedWordIdsRef.current.slice(0, 1);
        confirmDone(ids, ids.length, sessionImprintsRef.current, 0, false);
        doneCalledRef.current = true;
      }
    }
    navigate('/learn/session', { state: { words, isFirst: false } });
  };

  const startGame = () => {
    if (!words) return;
    const cfg = DIFFICULTY_CONFIG[difficulty];
    const count = Math.min(cfg.pairs, words.length);
    const selected = shuffle(words).slice(0, count);
    const newCards: MemoryCard[] = shuffle(
      selected.flatMap((word, i) => [
        { id: `${i}-en`, wordId: word.id, pairKey: String(i), content: word.english, type: 'en' as const, state: 'hidden' as const },
        { id: `${i}-cn`, wordId: word.id, pairKey: String(i), content: word.chinese, type: 'cn' as const, state: 'hidden' as const },
      ])
    );
    playedWordIdsRef.current = selected.map(w => w.id);
    sessionImprintsRef.current = 0;
    doneCalledRef.current = false;
    setCards(newCards);
    setSteps(0);
    currentStepsRef.current = 0;
    setPairCount(count);
    setFlippedIds([]);
    setIsChecking(false);
    doneCalledRef.current = false;
    allRevealedRef.current = false;
    setAllRevealed(false);
    setPhase('playing');
  };

  const handleRevealAll = () => {
    setCards(prev => prev.map(c => c.state === 'hidden' ? { ...c, state: 'flipped' as const } : c));
    allRevealedRef.current = true;
    setAllRevealed(true);
    setFlippedIds([]);
    setIsChecking(false);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (isChecking) return;
    if (card.state === 'matched') return;
    if (!allRevealedRef.current && card.state !== 'hidden') return;
    if (flippedIds.includes(card.id)) return;

    // In normal mode, flip the card face-up
    if (!allRevealedRef.current) {
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, state: 'flipped' as const } : c));
    }

    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const newSteps = currentStepsRef.current + 1;
      currentStepsRef.current = newSteps;
      setSteps(newSteps);
      setIsChecking(true);

      const id1 = newFlipped[0];
      const c1 = cards.find(c => c.id === id1);

      if (c1 && c1.pairKey === card.pairKey) {
        // MATCH — fly imprint dots: 2 if cards were hidden (memory), 1 if already revealed
        const amount = allRevealedRef.current ? 1 : 2;
        flyImprint(document.getElementById(id1), amount);
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c =>
              c.id === id1 || c.id === card.id ? { ...c, state: 'matched' as const } : c
            );
            const allDone = updated.every(c => c.state === 'matched');
            if (allDone) {
              const best = getBest(difficulty);
              const newRecord = best === null || newSteps < best;
              if (newRecord) {
                localStorage.setItem(DIFFICULTY_CONFIG[difficulty].storageKey, String(newSteps));
              }
              setPrevBest(best);
              setIsNewRecord(newRecord);
              setTimeout(() => setPhase('done'), 150);
            }
            return updated;
          });
          setFlippedIds([]);
          setIsChecking(false);
        }, 400);
      } else {
        // NO MATCH
        const delay = allRevealedRef.current ? 400 : 1000;
        setTimeout(() => {
          // In normal mode, flip both cards back; in reveal-all mode, keep them visible
          if (!allRevealedRef.current) {
            setCards(prev => prev.map(c =>
              c.id === id1 || c.id === card.id ? { ...c, state: 'hidden' as const } : c
            ));
          }
          setFlippedIds([]);
          setIsChecking(false);
        }, delay);
      }
    }
  };

  // Call confirmDone when entering done phase
  useEffect(() => {
    if (phase !== 'done' || doneCalledRef.current) return;
    doneCalledRef.current = true;
    confirmDone(playedWordIdsRef.current, playedWordIdsRef.current.length, sessionImprintsRef.current, 0, false);
  }, [phase]);

  if (!words) {
    return (
      <div>
        <NavBar title="翻牌配对" onBack={handleBack} />
        <div className="flex items-center justify-center h-60 text-gray-400">加载中...</div>
      </div>
    );
  }

  // Entry phase
  if (phase === 'entry') {
    return (
      <div className="pb-6">
        <NavBar title="翻牌配对" onBack={handleBack} />
        <div className="flex justify-center gap-4 py-2 bg-white/80 backdrop-blur border-b border-gray-100">
          <span className="text-xs text-gray-400">今日印记 <span className="text-sm font-bold text-blue-500">{todayImprints}</span></span>
          <span className="text-xs text-gray-400">总印记 <span className="text-sm font-bold text-gray-700">{totalImprints}</span></span>
        </div>
        <div className="px-4 pt-8 space-y-5 text-center">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-3xl font-bold text-gray-900">{words.length}</p>
            <p className="text-sm text-gray-400 mt-1">待复习单词</p>
          </div>
          <p className="text-sm text-gray-400">选择难度</p>
          <div className="flex flex-col gap-3">
            {(['easy', 'standard', 'hard'] as Difficulty[]).map(diff => {
              const cfg = DIFFICULTY_CONFIG[diff];
              const disabled = diff === 'hard' && words.length < 8;
              const selected = difficulty === diff;
              return (
                <button
                  key={diff}
                  disabled={disabled}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 rounded-xl p-3 border-2 transition ${
                    disabled
                      ? 'opacity-30 cursor-not-allowed border-gray-200 bg-white'
                      : selected
                      ? 'border-gray-900 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-900">{cfg.label}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {cfg.grid} · {Math.min(cfg.pairs, words.length)}对
                  </span>
                </button>
              );
            })}
          </div>
          <Button size="lg" onClick={startGame}>开始翻牌</Button>
          {getBest(difficulty) !== null && (
            <p className="text-xs text-gray-300">最佳步数：{getBest(difficulty)}步</p>
          )}
        </div>
      </div>
    );
  }

  // Done phase
  if (phase === 'done') {
    return (
      <div className="pb-6">
        <NavBar title="翻牌配对" />
        <div className="px-4 pt-8 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">全部配对完成！</h2>
          <p className="text-sm text-gray-400">
            共用了 <span className="font-bold text-gray-800">{steps}步</span> 完成 {pairCount}对
          </p>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">本次步数</span>
              <span className="font-bold text-gray-900">{steps}步</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-50 pt-3">
              <span className="text-gray-400">历史最佳</span>
              {isNewRecord ? (
                <span className="font-bold text-green-500">
                  新纪录！{prevBest !== null ? `（原${prevBest}步）` : ''}
                </span>
              ) : (
                <span className="font-bold text-gray-900">{getBest(difficulty)}步</span>
              )}
            </div>
            <div className="flex justify-between text-sm border-t border-gray-50 pt-3">
              <span className="text-gray-400">完成单词</span>
              <span className="font-bold text-gray-900">{pairCount}个</span>
            </div>
          </div>
          <Button size="lg" onClick={() => { doneCalledRef.current = false; setPhase('entry'); }}>再来一局</Button>
          <Button size="lg" variant="secondary" onClick={handleBack}>返回</Button>
        </div>
      </div>
    );
  }

  // Playing phase
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const matchedCount = cards.filter(c => c.state === 'matched').length / 2;

  return (
    <div className="pb-4">
      {/* Custom header for playing phase */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-900">翻牌配对</h1>
        <span className="text-sm text-gray-400">
          步数 <strong className="text-gray-900">{steps}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center px-4 py-1.5 text-xs text-gray-400 bg-white border-b border-gray-50">
        <span>{cfg.label} · {pairCount}对</span>
        <span>今日印记 <strong ref={imprintBarRef as any} className={`text-blue-500 inline-block transition-transform ${imprintBounce ? 'scale-125' : 'scale-100'}`}>{todayImprints}</strong></span>
        <span>已消 <strong className="text-gray-700">{matchedCount}</strong> / {pairCount}</span>
      </div>
      <div className="flex gap-2 px-3 pt-2">
        <button
          onClick={handleBack}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 active:bg-gray-200"
        >
          返回
        </button>
        {!allRevealed && (
          <button
            onClick={handleRevealAll}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-500 active:bg-blue-100"
          >
            全部翻开
          </button>
        )}
      </div>

      {/* Card grid */}
      <div
        className="grid p-3"
        style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`, gap: '7px' }}
      >
        {cards.map(card => {
          const isSelected = flippedIds.includes(card.id);
          const isClickable = card.state !== 'matched' && (allRevealed || card.state === 'hidden') && !flippedIds.includes(card.id);
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              id={card.id}
              style={{ perspective: '600px', aspectRatio: '1' }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.3s',
                  transform: card.state !== 'hidden' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  cursor: isClickable ? 'pointer' : 'default',
                }}
              >
                {/* Front — hidden state (dark back) */}
                <div
                  style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden',
                    borderRadius: '10px',
                    background: '#1a1a2e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.13)',
                    fontSize: '20px', fontWeight: 900,
                  }}
                >
                  ?
                </div>
                {/* Back — flipped/matched state (content) */}
                <div
                  style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: '10px',
                    background: card.state === 'matched'
                      ? '#dcfce7'
                      : isSelected ? '#eff6ff' : 'white',
                    border: card.state === 'matched'
                      ? '2px solid #4ade80'
                      : isSelected ? '2px solid #60a5fa' : '1.5px solid #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '5px',
                  }}
                >
                  <span
                    style={{
                      fontSize: cfg.pairs === 10 ? '9px' : '11px',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      fontWeight: card.type === 'en' ? 600 : 400,
                      color: card.state === 'matched' ? '#111827' : isSelected ? '#2563eb' : (card.type === 'en' ? '#111827' : '#374151'),
                      wordBreak: 'break-word',
                    }}
                  >
                    {card.content}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
