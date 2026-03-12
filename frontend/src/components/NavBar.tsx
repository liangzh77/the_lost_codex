interface Props {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}

export default function NavBar({ title, right, onBack }: Props) {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between h-11 px-4">
        <div className="w-16">
          {onBack && (
            <button className="text-blue-500 text-sm" onClick={onBack}>
              ← 返回
            </button>
          )}
        </div>
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <div className="w-16 flex justify-end">{right}</div>
      </div>
    </div>
  );
}
