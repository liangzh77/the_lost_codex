import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTodayReviewCount } from '../api';
import NavBar from '../components/NavBar';
import TabBar from '../components/TabBar';
import Card from '../components/Card';
import Button from '../components/Button';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    getTodayReviewCount().then((res) => setReviewCount(res.data.count));
  }, []);

  return (
    <div className="pb-20">
      <NavBar
        title="脑空白"
        right={
          <button className="text-sm text-gray-400" onClick={logout}>
            退出
          </button>
        }
      />
      <div className="px-4 pt-6 space-y-4">
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">你好，{user?.username}</p>
          <h2 className="text-4xl font-bold text-gray-900 mt-2">{reviewCount}</h2>
          <p className="text-gray-400 text-sm mt-1">今日待复习</p>
        </div>

        {reviewCount > 0 && (
          <Card>
            <Button size="lg" onClick={() => navigate('/learn/review')}>
              开始复习
            </Button>
          </Card>
        )}

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
