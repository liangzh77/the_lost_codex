import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/home', label: '首页', icon: '🏠' },
  { path: '/words', label: '单词', icon: '📖' },
  { path: '/growth', label: '成长', icon: '🌱' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-gray-100">
      <div className="flex items-center h-16 pb-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              className={`flex-1 flex flex-col items-center gap-0.5 text-xs ${active ? 'text-blue-500' : 'text-gray-400'}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
