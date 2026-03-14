import { useEffect, useState } from 'react';
import { getGrowthStats, getHeatmap, getEnergyCurve, getAchievements } from '../api';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ChartTab = 'energy' | 'heatmap';

interface Stats {
  today_imprints: number;
  today_energy: number;
  total_imprints: number;
  total_energy: number;
  level: number;
  level_name: string;
  next_level_energy: number | null;
}

interface Achievement {
  key: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: string;
}

export default function GrowthPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartTab, setChartTab] = useState<ChartTab>('energy');
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [energyData, setEnergyData] = useState<{ date: string; energy: number; imprints: number }[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    getGrowthStats().then((r) => setStats(r.data));
    getHeatmap(90).then((r) => setHeatmapData(r.data));
    getEnergyCurve(30).then((r) => setEnergyData(r.data));
    getAchievements().then((r) => setAchievements(r.data));
  }, []);

  const levelProgress = stats && stats.next_level_energy
    ? Math.round((stats.total_energy / stats.next_level_energy) * 100)
    : 100;

  return (
    <div className="pb-20">
      <NavBar title="成长" />
      <div className="px-4 pt-4 space-y-4">
        {stats && (
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">当前等级</p>
                <p className="text-xl font-bold text-gray-900">Lv.{stats.level} {stats.level_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">累计能量</p>
                <p className="text-xl font-bold text-blue-500">{stats.total_energy}</p>
              </div>
            </div>
            {stats.next_level_energy && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>升级进度</span>
                  <span>{stats.total_energy}/{stats.next_level_energy}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{stats.today_imprints}</p>
                <p className="text-xs text-gray-400">今日印记</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-500">{stats.today_energy}</p>
                <p className="text-xs text-gray-400">今日能量</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-700">{stats.total_imprints}</p>
                <p className="text-xs text-gray-400">总印记</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <button
              className={`flex-1 py-1.5 text-sm rounded-lg ${chartTab === 'energy' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setChartTab('energy')}
            >能量曲线</button>
            <button
              className={`flex-1 py-1.5 text-sm rounded-lg ${chartTab === 'heatmap' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setChartTab('heatmap')}
            >印记记录</button>
          </div>

          {chartTab === 'energy' ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Area type="monotone" dataKey="energy" stroke="#3b82f6" fill="#dbeafe" name="能量" />
                  <Area type="monotone" dataKey="imprints" stroke="#a855f7" fill="#f3e8ff" name="印记" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-1">
              {renderHeatmap(heatmapData)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">成就</h3>
          {achievements.map((a) => (
            <div key={a.key} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className={`text-2xl ${a.unlocked ? '' : 'grayscale opacity-40'}`}>{a.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${a.unlocked ? 'text-gray-900' : 'text-gray-400'}`}>{a.name}</p>
                  {a.unlocked && <span className="text-xs text-green-500">已解锁</span>}
                </div>
                <p className="text-xs text-gray-400">{a.target || a.desc}</p>
                {!a.unlocked && (
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.round(a.progress * 100)}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  );
}

function renderHeatmap(data: { date: string; count: number }[]) {
  const map = new Map(data.map((d) => [d.date, d.count]));
  const today = new Date();
  const weeks: { date: string; count: number }[][] = [];
  let week: { date: string; count: number }[] = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push({ date: key, count: map.get(key) || 0 });
  }
  if (week.length > 0) weeks.push(week);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 3) return 'bg-green-200';
    if (count <= 10) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className="flex gap-0.5 overflow-x-auto">
      {weeks.map((w, wi) => (
        <div key={wi} className="flex flex-col gap-0.5">
          {w.map((d) => (
            <div
              key={d.date}
              className={`w-3 h-3 rounded-sm ${getColor(d.count)}`}
              title={`${d.date}: ${d.count}次`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
