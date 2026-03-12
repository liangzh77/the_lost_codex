import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayReview } from '../api';
import NavBar from '../components/NavBar';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayReview().then((res) => {
      setLoading(false);
      if (res.data.length === 0) {
        alert('今天没有需要复习的单词');
        navigate('/home');
      } else {
        navigate('/learn/session', { state: { words: res.data, isFirst: false }, replace: true });
      }
    });
  }, [navigate]);

  if (loading) {
    return (
      <div>
        <NavBar title="复习" onBack={() => navigate('/home')} />
        <div className="flex items-center justify-center h-60 text-gray-400">加载中...</div>
      </div>
    );
  }
  return null;
}
