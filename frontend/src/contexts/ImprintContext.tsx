import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getGrowthStats } from '../api';
import { useAuth } from './AuthContext';

interface ImprintContextType {
  todayImprints: number;
  totalImprints: number;
  addImprints: (n: number) => void;
}

const ImprintContext = createContext<ImprintContextType>({
  todayImprints: 0,
  totalImprints: 0,
  addImprints: () => {},
});

export function ImprintProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [todayImprints, setTodayImprints] = useState(0);
  const [totalImprints, setTotalImprints] = useState(0);

  useEffect(() => {
    if (!token) return;
    getGrowthStats().then(r => {
      setTodayImprints(r.data.today_imprints);
      setTotalImprints(r.data.total_imprints);
    });
  }, [token]);

  const addImprints = (n: number) => {
    setTodayImprints(c => c + n);
    setTotalImprints(c => c + n);
  };

  return (
    <ImprintContext.Provider value={{ todayImprints, totalImprints, addImprints }}>
      {children}
    </ImprintContext.Provider>
  );
}

export const useImprints = () => useContext(ImprintContext);
