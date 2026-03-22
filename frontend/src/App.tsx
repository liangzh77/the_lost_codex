import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ImprintProvider } from './contexts/ImprintContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import NewWordsPage from './pages/NewWordsPage';
import SessionPage from './pages/SessionPage';
import MemoryPage from './pages/MemoryPage';
import WordsPage from './pages/WordsPage';
import SettingsPage from './pages/SettingsPage';
import GrowthPage from './pages/GrowthPage';
import GamePage from './pages/GamePage';
import './index.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/home" /> : <LoginPage />} />
      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/learn/new" element={<PrivateRoute><NewWordsPage /></PrivateRoute>} />
      <Route path="/learn/session" element={<PrivateRoute><SessionPage /></PrivateRoute>} />
      <Route path="/memory" element={<PrivateRoute><MemoryPage /></PrivateRoute>} />
      <Route path="/words" element={<PrivateRoute><WordsPage /></PrivateRoute>} />
      <Route path="/growth" element={<PrivateRoute><GrowthPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/game" element={<PrivateRoute><GamePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={token ? '/home' : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ImprintProvider>
          <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </ImprintProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
