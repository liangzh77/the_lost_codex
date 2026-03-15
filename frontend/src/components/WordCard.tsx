import { useEffect, useRef } from 'react';
import { getWordAudio } from '../api';

interface WordInfo {
  id: number;
  english: string;
  chinese: string;
  phonetic: string;
  chinese_explanation: string;
  english_explanation: string;
  example_sentence: string;
}

interface Props {
  word: WordInfo | null;
  open: boolean;
  onClose?: () => void;
  playOnClick?: boolean; // 是否点击时播放，默认 true
}

export default function WordCard({ word, open, onClose, playOnClick = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const playAudio = () => {
    if (word) {
      const audio = new Audio(getWordAudio(word.english));
      audio.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (word && open) {
      playAudio();
    }
  }, [word, open]);

  // 点击卡片外部时关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open, onClose]);

  if (!word || !open) return null;

  const handleCardClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    if (playOnClick) {
      playAudio();
    } else {
      onClose?.();
    }
  };

  return (
    <div
      ref={cardRef}
      className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-2xl shadow-lg border-t border-gray-100 p-4 space-y-2"
      onClick={handleCardClick}
    >
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
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
}
