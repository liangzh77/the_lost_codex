import Modal from './Modal';

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
  onClose: () => void;
}

export default function WordCard({ word, open, onClose }: Props) {
  if (!word) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{word.english}</h2>
          <p className="text-sm text-gray-400 mt-1">{word.phonetic}</p>
        </div>
        <div className="text-center text-xl text-gray-700">{word.chinese}</div>
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
          <div>
            <span className="text-gray-400">中文释义：</span>
            <span className="text-gray-700">{word.chinese_explanation}</span>
          </div>
          <div>
            <span className="text-gray-400">英文释义：</span>
            <span className="text-gray-700">{word.english_explanation}</span>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-600 italic">
          {word.example_sentence}
        </div>
      </div>
    </Modal>
  );
}
