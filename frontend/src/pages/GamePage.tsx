import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayReview, getQuiz, confirmDone, getWordAudio, getGrowthStats } from '../api';
import NavBar from '../components/NavBar';
import Button from '../components/Button';

type GamePhase = 'entry' | 'loading' | 'playing' | 'gameover' | 'victory';

interface WordInfo {
  id: number;
  english: string;
  chinese: string;
  phonetic: string;
  chinese_explanation: string;
  english_explanation: string;
  example_sentence: string;
}

interface QuizData {
  word_id: number;
  quiz_type: string;
  question: string;
  options: string[];
  correct_answer: string;
}

const INITIAL_FALL = 8;
const MIN_FALL = 3;

export default function GamePage() {
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState<GamePhase>('entry');
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  // word/quiz data (state for rendering, refs for callbacks)
  const [words, setWords] = useState<WordInfo[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const wordsRef = useRef<WordInfo[]>([]);
  const quizzesRef = useRef<QuizData[]>([]);

  // live game state
  const [wordIndex, setWordIndex] = useState(0);
  const [monsterKey, setMonsterKey] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [wrongOptions, setWrongOptions] = useState<Set<string>>(new Set());
  const [monsterDead, setMonsterDead] = useState(false);
  const [showCannonball, setShowCannonball] = useState(false);
  const [fallDuration, setFallDuration] = useState(INITIAL_FALL);
  const [progressWidth, setProgressWidth] = useState(0);

  // HUD imprints
  const [todayImprints, setTodayImprints] = useState(0);
  const [imprintBounce, setImprintBounce] = useState(false);

  // end-game snapshot
  const [endData, setEndData] = useState({ score: 0, firstTry: 0, total: 0, bestCombo: 0, imprints: 0 });

  // refs for mutable values inside callbacks
  const wordIndexRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const fallDurationRef = useRef(INITIAL_FALL);
  const tryCountRef = useRef(0);
  const answeredRef = useRef(false);
  const doneFiredRef = useRef(false);
  const firstTryCorrectIdsRef = useRef<number[]>([]);
  const totalPlayedRef = useRef(0);
  const firstTryCorrectCountRef = useRef(0);
  const scoreRef = useRef(0);
  const sessionImprintsRef = useRef(0);
  const rafRef = useRef<number>(0);
  const spawnTimeRef = useRef(0);
  const imprintBarRef = useRef<HTMLSpanElement>(null);

  // load entry screen data
  useEffect(() => {
    if (gamePhase !== 'entry') return;
    getTodayReview().then(res => setReviewCount(res.data.length));
    getGrowthStats().then(res => setTodayImprints(res.data.today_imprints));
    const stored = parseInt(localStorage.getItem('monster_best_combo') || '0', 10);
    setBestCombo(stored);
    bestComboRef.current = stored;
  }, [gamePhase]);

  // intercept browser back while playing
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    window.history.pushState(null, '', window.location.href);
    const onPop = () => {
      if (window.confirm('退出游戏？当前进度将丢失。')) {
        navigate('/home');
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [gamePhase, navigate]);

  // call confirmDone when game ends
  useEffect(() => {
    if ((gamePhase === 'gameover' || gamePhase === 'victory') && !doneFiredRef.current) {
      doneFiredRef.current = true;
      confirmDone(
        firstTryCorrectIdsRef.current,
        totalPlayedRef.current,
        firstTryCorrectCountRef.current,
        0
      ).catch(() => {});
      setEndData({
        score: scoreRef.current,
        firstTry: firstTryCorrectCountRef.current,
        total: totalPlayedRef.current,
        bestCombo: bestComboRef.current,
        imprints: sessionImprintsRef.current,
      });
    }
  }, [gamePhase]);

  // progress bar via requestAnimationFrame
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    spawnTimeRef.current = Date.now();
    setProgressWidth(0);
    const tick = () => {
      const progress = Math.min(
        (Date.now() - spawnTimeRef.current) / (fallDurationRef.current * 1000),
        1
      );
      setProgressWidth(progress * 100);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gamePhase, monsterKey]);

  // flyImprint — adapted from SessionPage.tsx
  const flyImprint = useCallback((sourceEl: HTMLElement | null, amount: number) => {
    if (!sourceEl || !imprintBarRef.current) return;
    const src = sourceEl.getBoundingClientRect();
    const dst = imprintBarRef.current.getBoundingClientRect();
    const sx = src.left + src.width / 2;
    const sy = src.top + src.height / 2;
    const ex = dst.left + dst.width / 2;
    const ey = dst.top + dst.height / 2;
    for (let i = 0; i < amount; i++) {
      const dot = document.createElement('div');
      const delay = i * 120;
      dot.style.cssText = `position:fixed;z-index:9999;width:12px;height:12px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#60a5fa);box-shadow:0 0 8px rgba(59,130,246,0.6);left:${sx - 6}px;top:${sy - 6}px;pointer-events:none;opacity:1;animation:imprintFlyGame 600ms ${delay}ms cubic-bezier(0.2,0.8,0.2,1) forwards;`;
      document.body.appendChild(dot);
      setTimeout(() => {
        dot.remove();
        setTodayImprints(c => c + 1);
        sessionImprintsRef.current++;
        setImprintBounce(true);
        setTimeout(() => setImprintBounce(false), 300);
      }, 600 + delay);
    }
    let st = document.getElementById('imprint-fly-game-style') as HTMLStyleElement | null;
    if (!st) { st = document.createElement('style'); st.id = 'imprint-fly-game-style'; document.head.appendChild(st); }
    st.textContent = `@keyframes imprintFlyGame{0%{transform:scale(1);opacity:1;}50%{transform:translate(${(ex - sx) * 0.5}px,${(ey - sy) * 0.5 - 40}px) scale(0.8);opacity:0.8;}100%{transform:translate(${ex - sx}px,${ey - sy}px) scale(0.3);opacity:0;}}`;
  }, []);

  const goNextWord = useCallback(() => {
    const next = wordIndexRef.current + 1;
    if (next >= wordsRef.current.length) {
      setGamePhase('victory');
      return;
    }
    answeredRef.current = false;
    tryCountRef.current = 0;
    setWrongOptions(new Set());
    setMonsterDead(false);
    setShowCannonball(false);
    wordIndexRef.current = next;
    setWordIndex(next);
    setMonsterKey(k => k + 1);
    new Audio(getWordAudio(wordsRef.current[next].english)).play().catch(() => {});
  }, []);

  const handleMonsterReachBottom = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    cancelAnimationFrame(rafRef.current);
    comboRef.current = 0;
    setCombo(0);
    totalPlayedRef.current++;
    const newLives = livesRef.current - 1;
    livesRef.current = newLives;
    setLives(newLives);
    if (newLives <= 0) { setGamePhase('gameover'); return; }
    setTimeout(goNextWord, 400);
  }, [goNextWord]);

  const handleSelect = (option: string, e: React.MouseEvent) => {
    const quiz = quizzesRef.current[wordIndexRef.current];
    if (!quiz || answeredRef.current || monsterDead) return;

    if (option === quiz.correct_answer) {
      answeredRef.current = true;
      cancelAnimationFrame(rafRef.current);

      const isFirst = tryCountRef.current === 0;
      const isSecond = tryCountRef.current === 1;

      if (isFirst) {
        const mult = comboRef.current >= 6 ? 3 : comboRef.current >= 3 ? 2 : 1;
        scoreRef.current += 30 * mult;
        setScore(scoreRef.current);
        const nc = comboRef.current + 1;
        comboRef.current = nc;
        setCombo(nc);
        const nb = Math.max(bestComboRef.current, nc);
        bestComboRef.current = nb;
        setBestCombo(nb);
        localStorage.setItem('monster_best_combo', String(nb));
        firstTryCorrectIdsRef.current.push(wordsRef.current[wordIndexRef.current].id);
        firstTryCorrectCountRef.current++;
        flyImprint(e.currentTarget as HTMLElement, 1);
        setShowCannonball(true);
      } else if (isSecond) {
        scoreRef.current += 10;
        setScore(scoreRef.current);
      }
      // 3rd+ try: +0 pts

      totalPlayedRef.current++;
      const nf = Math.max(fallDurationRef.current * 0.95, MIN_FALL);
      fallDurationRef.current = nf;
      setFallDuration(nf);
      setMonsterDead(true);
      setTimeout(goNextWord, 600);
    } else {
      setWrongOptions(prev => new Set(prev).add(option));
      comboRef.current = 0;
      setCombo(0);
      tryCountRef.current++;
    }
  };

  const handleStartGame = async () => {
    try { new Audio(getWordAudio('hello')).play(); } catch { /* unlock iOS audio */ }
    setGamePhase('loading');
    try {
      const res = await getTodayReview();
      const wl: WordInfo[] = [...res.data];
      // Fisher-Yates shuffle
      for (let i = wl.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wl[i], wl[j]] = [wl[j], wl[i]];
      }
      const qrs = await Promise.all(wl.map(w => getQuiz(w.id, 'en_to_cn')));
      const ql: QuizData[] = qrs.map(r => ({ ...r.data, options: (r.data.options as string[]).slice(0, 3) }));

      // reset all refs
      wordsRef.current = wl; quizzesRef.current = ql;
      wordIndexRef.current = 0; livesRef.current = 3; comboRef.current = 0;
      fallDurationRef.current = INITIAL_FALL; tryCountRef.current = 0;
      answeredRef.current = false; doneFiredRef.current = false;
      firstTryCorrectIdsRef.current = []; totalPlayedRef.current = 0;
      firstTryCorrectCountRef.current = 0; scoreRef.current = 0; sessionImprintsRef.current = 0;

      // reset all state
      setWords(wl); setQuizzes(ql); setWordIndex(0); setMonsterKey(0);
      setLives(3); setScore(0); setCombo(0); setFallDuration(INITIAL_FALL);
      setWrongOptions(new Set()); setMonsterDead(false); setShowCannonball(false);

      new Audio(getWordAudio(wl[0].english)).play().catch(() => {});
      setGamePhase('playing');
    } catch {
      setGamePhase('entry');
    }
  };

  // ——— RENDER ———

  if (gamePhase === 'entry' || gamePhase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
        <NavBar title="单词战场" onBack={() => navigate('/home')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div style={{ fontSize: 64 }}>👾</div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">怪物防御战</h1>
            <p className="text-slate-400 text-sm">听发音，选正确释义<br />别让怪物冲到你的炮台！</p>
          </div>
          <div className="flex gap-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{reviewCount === null ? '…' : reviewCount}</div>
              <div className="text-xs text-slate-500 mt-1">今日单词</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{bestCombo}</div>
              <div className="text-xs text-slate-500 mt-1">最高连击</div>
            </div>
          </div>
          {reviewCount === 0 ? (
            <p className="text-slate-500 text-sm">今天没有待复习的单词</p>
          ) : (
            <Button
              size="lg"
              onClick={handleStartGame}
              disabled={gamePhase === 'loading' || reviewCount === null || reviewCount === 0}
            >
              {gamePhase === 'loading' ? '准备中...' : '开始战斗！'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (gamePhase === 'gameover' || gamePhase === 'victory') {
    const win = gamePhase === 'victory';
    const acc = endData.total > 0 ? Math.round((endData.firstTry / endData.total) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-5" style={{ background: '#0f172a' }}>
        <div style={{ fontSize: 56 }}>{win ? '🏆' : '💀'}</div>
        <div className="text-center">
          <h2 className={`text-3xl font-extrabold tracking-widest ${win ? 'text-yellow-400' : 'text-red-500'}`}>
            {win ? '全部消灭！' : 'GAME OVER'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{win ? '你守住了防线！' : '怪物突破了防线！'}</p>
        </div>
        <div className="rounded-2xl p-6 w-full max-w-xs text-center space-y-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div>
            <div className="text-slate-400 text-xs">本轮得分</div>
            <div className="text-yellow-400 text-4xl font-extrabold">{endData.score}</div>
          </div>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-white font-bold">{acc}%</div>
              <div className="text-slate-500 text-xs">首次正确率</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">{endData.bestCombo}</div>
              <div className="text-slate-500 text-xs">最高连击</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">{endData.imprints}</div>
              <div className="text-slate-500 text-xs">获得印记</div>
            </div>
          </div>
        </div>
        <Button size="lg" onClick={() => setGamePhase('entry')}>再来一局</Button>
        <button className="text-slate-500 text-sm underline" onClick={() => navigate('/home')}>返回首页</button>
      </div>
    );
  }

  // Playing
  const curWord = words[wordIndex];
  const curQuiz = quizzes[wordIndex];
  if (!curWord || !curQuiz) return null;

  const multLabel = combo >= 6 ? 'x3' : combo >= 3 ? 'x2' : null;
  const progressRed = progressWidth > 80;

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#0f172a' }}>
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1e293b' }}>
        <span className="text-white font-bold">{score}</span>
        <div className="flex items-center gap-2">
          {multLabel && (
            <span className="text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.12)' }}>
              {multLabel} COMBO
            </span>
          )}
          <span
            ref={imprintBarRef}
            className={`text-blue-400 text-sm font-bold inline-block transition-transform ${imprintBounce ? 'scale-125' : 'scale-100'}`}
          >
            ◆{todayImprints}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ fontSize: 16, color: i < lives ? '#f87171' : '#1e293b' }}>♥</span>
          ))}
        </div>
      </div>

      {/* Game field */}
      <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)' }}>
        {/* Stars */}
        {[[15,10],[60,5],[80,20],[30,35],[70,50],[45,8],[20,65],[85,42],[10,55],[92,15],[50,28],[5,75]].map(([l,t],i) => (
          <div key={i} style={{ position:'absolute', width:2, height:2, background:'#fff', borderRadius:'50%', opacity:0.25, left:`${l}%`, top:`${t}%` }} />
        ))}

        {/* Monster */}
        <div
          key={monsterKey}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            animation: `monsterFall ${fallDuration}s linear forwards`,
            opacity: monsterDead ? 0 : 1,
            transition: monsterDead ? 'opacity 0.15s' : 'none',
          }}
          onAnimationEnd={(e) => {
            if (e.animationName === 'monsterFall') handleMonsterReachBottom();
          }}
        >
          <div style={{ fontSize: 52, filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.5))' }}>👾</div>
          <div style={{
            marginTop: 4, background: 'rgba(0,0,0,0.75)', color: '#fbbf24',
            fontSize: 14, fontWeight: 700, padding: '3px 12px', borderRadius: 8,
            border: '1px solid rgba(251,191,36,0.3)', whiteSpace: 'nowrap',
          }}>
            {curWord.english}
          </div>
        </div>

        {/* Cannonball */}
        {showCannonball && (
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            width: 14, height: 14, background: '#fbbf24', borderRadius: '50%',
            boxShadow: '0 0 14px #fbbf24, 0 0 28px rgba(251,191,36,0.4)',
            animation: 'cannonballFly 0.55s ease-out forwards',
          }} />
        )}

        {/* Cannon */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ fontSize: 34 }}>🏰</div>
        </div>
      </div>

      {/* Urgency bar */}
      <div style={{ height: 4, background: '#0f172a', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${progressWidth}%`,
          background: progressRed ? '#ef4444' : '#3b82f6',
          transition: 'background 0.3s',
        }} />
      </div>

      {/* Answer panel */}
      <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '12px 16px 28px', flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: '#64748b', fontSize: 12 }}>听发音，选正确的中文意思</span>
          <button
            style={{ color: '#60a5fa', fontSize: 12 }}
            onClick={() => new Audio(getWordAudio(curWord.english)).play().catch(() => {})}
          >
            🔊 重播
          </button>
        </div>
        <div className="space-y-2">
          {curQuiz.options.map((opt, i) => {
            const isWrong = wrongOptions.has(opt);
            const isCorrectShown = monsterDead && opt === curQuiz.correct_answer;
            let bg = '#0f172a', border = '#334155', color = '#e2e8f0';
            if (isCorrectShown) { bg = 'rgba(34,197,94,0.1)'; border = '#22c55e'; color = '#4ade80'; }
            else if (isWrong) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#f87171'; }
            return (
              <button
                key={i}
                style={{
                  display: 'block', width: '100%', background: bg, color,
                  border: `1px solid ${border}`, borderRadius: 12,
                  padding: '12px 16px', fontSize: 14, fontWeight: 500, textAlign: 'left',
                  opacity: (isWrong || monsterDead) ? 0.75 : 1,
                  cursor: (isWrong || monsterDead) ? 'default' : 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onClick={(e) => handleSelect(opt, e)}
                disabled={isWrong || monsterDead}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-3" style={{ fontSize: 12, color: '#475569' }}>
          <span>{wordIndex + 1}/{words.length}</span>
          <span>连击 {combo}</span>
        </div>
      </div>
    </div>
  );
}
