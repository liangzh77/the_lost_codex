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
}

export default function WordCard({ word, open, onClose }: Props) {
  if (!word || !open) return null;

  const handleCardClick = () => {
    // 如果用户正在选择文字，不关闭
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    onClose?.();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-2xl shadow-lg border-t border-gray-100 p-4 space-y-2" onClick={handleCardClick}>
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
