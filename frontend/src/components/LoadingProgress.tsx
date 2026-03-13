interface LoadingProgressProps {
  current: number;
  total: number;
  word: string;
}

export default function LoadingProgress({ current, total, word }: LoadingProgressProps) {
  if (total <= 0) return null;
  const pct = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <p className="text-sm text-center text-gray-500">
        加载中 {current}/{total}：{word}
      </p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
