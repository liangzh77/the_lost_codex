import { useAuth } from '../contexts/AuthContext';

export default function UserBadge() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">{user.username}</span>
      <button className="text-xs text-gray-300" onClick={logout}>退出</button>
    </div>
  );
}
