import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login, register } from '../api';
import Button from '../components/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = isRegister ? register : login;
      const res = await fn(username, password);
      setToken(res.data.access_token);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">脑空白</h1>
          <p className="text-sm text-gray-400 mt-1">The Lost Codex</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-base outline-none focus:border-blue-400 transition"
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-base outline-none focus:border-blue-400 transition"
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button className="text-blue-500 ml-1" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? '去登录' : '去注册'}
          </button>
        </p>
      </div>
    </div>
  );
}
