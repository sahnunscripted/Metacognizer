import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { statsApi } from '../services/api';
import { useAuth } from './AuthContext';

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      const response = await statsApi.get();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }
    fetchStats();
    statsApi.checkin().catch(console.error);
  }, [user, fetchStats]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  const addPoints = useCallback((points) => {
    setStats(prev => prev ? {
      ...prev,
      totalPoints: prev.totalPoints + points
    } : null);
  }, []);

  const value = {
    stats,
    loading,
    refreshStats,
    addPoints,
    totalPoints: stats?.totalPoints || 0,
    currentStreak: stats?.currentStreak || 0,
    longestStreak: stats?.longestStreak || 0,
    achievements: stats?.achievements || [],
    totalActionsCompleted: stats?.totalActionsCompleted || 0
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}
