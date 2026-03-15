import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayReviewCount, getLearningStats } from '../api';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import Card from '../components/Card';
import Button from '../components/Button';

export default function HomePage() {
  const navigate = useNavigate();
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewGroupCount, setReviewGroupCount] = useState(0);
  const [stats, setStats] = useState({ learning: 0, mastered: 0 });

  useEffect(() => {
    getTodayReviewCount().then((res) => {
      setReviewCount(res.data.count);
      setReviewGroupCount(res.data.group_count || 0);
    });
    getLearningStats().then((res) => setStats(res.data));
  }, []);

  return (
    <div className="pb-20">
      <NavBar title="脑空白" />
      <div className="px-4 pt-6 space-y-4">
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-gray-900">{reviewGroupCount}组 {reviewCount}词</h2>
          <p className="text-gray-400 text-sm mt-1">今日待复习</p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.learning}</p>
            <p className="text-xs text-gray-400 mt-1">在学中</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.mastered}</p>
            <p className="text-xs text-gray-400 mt-1">已掌握</p>
          </div>
        </div>

        <Card>
          <Button
            size="lg"
            onClick={() => navigate('/words')}
            disabled={reviewCount === 0}
          >
            开始复习
          </Button>
        </Card>

        <Card>
          <Button size="lg" variant="secondary" onClick={() => navigate('/learn/new')}>
            学习新词
          </Button>
        </Card>
      </div>
      <TabBar />
    </div>
  );
}
