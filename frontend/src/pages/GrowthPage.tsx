import { useEffect, useState } from 'react';
import { getGrowthStats, getHeatmap, getEnergyCurve, getAchievements } from '../api';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type ChartTab = 'imprints' | 'heatmap';

interface Stats {
  today_imprints: number;
  total_imprints: number;
  level: number;
  level_name: string;
  next_level_imprints: number | null;
}

interface Achievement {
  key: string;
  name: string;
  desc: string;
  icon: string;
  tier: number;
  max_tier: number;
  next_name: string | null;
  unlocked: boolean;
  progress: number;
  target: string;
  value: number;
  all_tiers: { name: string; desc: string; threshold: number }[];
}

const CURVE_RANGES = [
  { label: '3天', days: 3 },
  { label: '一周', days: 7 },
  { label: '一月', days: 30 },
  { label: '一季', days: 90 },
  { label: '一年', days: 365 },
  { label: '全部', days: 0 },
];

export default function GrowthPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartTab, setChartTab] = useState<ChartTab>('imprints');
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [imprintData, setImprintData] = useState<{ date: string; imprints: number; spelling_imprints: number }[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [curveDays, setCurveDays] = useState(30);
  const [showAchievementWall, setShowAchievementWall] = useState(false);

  useEffect(() => {
    getGrowthStats().then((r) => setStats(r.data));
    getHeatmap(90).then((r) => setHeatmapData(r.data));
    getAchievements().then((r) => setAchievements(r.data));
  }, []);

  useEffect(() => {
    getEnergyCurve(curveDays).then((r) => setImprintData(r.data));
  }, [curveDays]);

  const levelProgress = stats && stats.next_level_imprints
    ? Math.round((stats.total_imprints / stats.next_level_imprints) * 100)
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
                <p className="text-xs text-gray-400">总印记</p>
                <p className="text-xl font-bold text-blue-500">{stats.total_imprints}</p>
              </div>
            </div>
            {stats.next_level_imprints && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>升级进度</span>
                  <span>{stats.total_imprints}/{stats.next_level_imprints}</span>
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
                <p className="text-lg font-bold text-gray-700">{stats.total_imprints}</p>
                <p className="text-xs text-gray-400">总印记</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <button
              className={`flex-1 py-1.5 text-sm rounded-lg ${chartTab === 'imprints' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setChartTab('imprints')}
            >印记曲线</button>
            <button
              className={`flex-1 py-1.5 text-sm rounded-lg ${chartTab === 'heatmap' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
              onClick={() => setChartTab('heatmap')}
            >印记记录</button>
          </div>

          {chartTab === 'imprints' ? (
            <>
              <div className="flex gap-1">
                {CURVE_RANGES.map((r) => (
                  <button
                    key={r.days}
                    className={`flex-1 py-1 text-xs rounded-md ${curveDays === r.days ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'}`}
                    onClick={() => setCurveDays(r.days)}
                  >{r.label}</button>
                ))}
              </div>
              <div className="h-52">
                {imprintData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={imprintData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradImprints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradSpelling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickFormatter={(v) => v.slice(5)}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    width={36}
                    tickMargin={4}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      padding: '8px 14px',
                      fontSize: 13,
                    }}
                    labelFormatter={(v) => `${v}`}
                    cursor={{ stroke: '#d4d4d8', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="imprints" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradImprints)" name="印记" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                  <Area type="monotone" dataKey="spelling_imprints" stroke="#a855f7" strokeWidth={2} fill="url(#gradSpelling)" name="拼写印记" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">加载中...</div>
                )}
            </div>
            </>
          ) : (
            <div>
              {renderHeatmap(heatmapData)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-400">成就</h3>
            <button
              className="text-xs text-blue-500 px-2 py-1 rounded-lg bg-blue-50"
              onClick={() => setShowAchievementWall(true)}
            >成就墙</button>
          </div>
          {achievements.map((a) => (
            <div key={a.key} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className={`text-2xl ${a.tier > 0 ? '' : 'grayscale opacity-40'}`}>{a.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${a.tier > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{a.name}</p>
                  {a.tier > 0 && (
                    <span className="text-xs text-green-500">
                      {a.tier === a.max_tier ? '已满级' : `${a.tier}/${a.max_tier}`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {a.next_name ? `下一阶: ${a.next_name} (${a.target})` : a.target}
                </p>
                {a.tier < a.max_tier && (
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.round(a.progress * 100)}%` }} />
                  </div>
                )}
                {a.tier > 0 && a.tier < a.max_tier && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: a.max_tier }).map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < a.tier ? 'bg-green-400' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAchievementWall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAchievementWall(false)}>
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium text-gray-900">成就墙</h3>
              <button className="text-gray-400 text-lg" onClick={() => setShowAchievementWall(false)}>✕</button>
            </div>
            <div className="space-y-4">
              {achievements.map((a) => {
                const categoryName = a.key === 'deep_cultivator' ? '单日印记'
                  : a.key === 'imprint_collector' ? '总印记'
                  : a.key === 'spelling_master' ? '拼写正确'
                  : '已掌握单词';
                const currentValue = a.value;
                return (
                <div key={a.key}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs text-gray-500">{categoryName}</span>
                    <span className="text-xs text-green-500 ml-auto">当前 {currentValue}</span>
                  </div>
                  <div className="flex gap-2">
                    {a.all_tiers.map((t, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${i < a.tier ? 'bg-green-50' : 'bg-gray-50 grayscale opacity-40'}`}>
                          {a.icon}
                        </div>
                        <p className={`text-[10px] text-center leading-tight ${i < a.tier ? 'text-gray-700' : 'text-gray-300'}`}>{t.name}</p>
                        <p className={`text-[9px] ${i < a.tier ? 'text-gray-400' : 'text-gray-300'}`}>{t.threshold}</p>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
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

  // Pad first week to start from Monday
  if (weeks.length > 0 && weeks[0].length < 7) {
    const pad = 7 - weeks[0].length;
    weeks[0] = Array(pad).fill(null).map((_, i) => ({ date: `pad-${i}`, count: -1 })).concat(weeks[0]);
  }

  const getColor = (count: number) => {
    if (count < 0) return 'bg-transparent';
    if (count === 0) return 'bg-gray-100';
    if (count <= 3) return 'bg-green-200';
    if (count <= 10) return 'bg-green-400';
    return 'bg-green-600';
  };

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  // Collect month labels
  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = '';
  weeks.forEach((w, wi) => {
    const firstReal = w.find((d) => d.count >= 0);
    if (firstReal) {
      const m = firstReal.date.slice(0, 7);
      if (m !== lastMonth) {
        monthLabels.push({ index: wi, label: `${parseInt(firstReal.date.slice(5, 7))}月` });
        lastMonth = m;
      }
    }
  });

  return (
    <div className="space-y-1.5">
      {/* Month labels */}
      <div className="flex" style={{ paddingLeft: 28 }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.index === wi);
          return (
            <div key={wi} className="flex-1 text-center">
              <span className="text-[10px] text-gray-400">{ml ? ml.label : ''}</span>
            </div>
          );
        })}
      </div>
      {/* Grid */}
      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col justify-around pr-1.5 shrink-0" style={{ width: 28 }}>
          {dayLabels.map((l, i) => (
            <span key={i} className="text-[10px] text-gray-400 text-right leading-none">{i % 2 === 1 ? l : ''}</span>
          ))}
        </div>
        {/* Weeks grid - stretch to fill */}
        <div className="flex flex-1 gap-[3px]">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col flex-1 gap-[3px]">
              {w.map((d, di) => (
                <div
                  key={d.date}
                  className={`aspect-square rounded-[3px] ${getColor(d.count)}`}
                  title={d.count >= 0 ? `${d.date}: ${d.count}次` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-1 pt-1">
        <span className="text-[10px] text-gray-400">少</span>
        {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600'].map((c) => (
          <div key={c} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-gray-400">多</span>
      </div>
    </div>
  );
}
