import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onboardingApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useCelebration } from './CelebrationContext';
import { useStats } from './StatsContext';

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const { celebrate } = useCelebration();
  const { refreshStats } = useStats();
  const [state, setState] = useState({
    unloadComplete: false,
    dismissed: false,
    completedMissions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setState({ unloadComplete: false, dismissed: false, completedMissions: [] });
      setLoading(false);
      return;
    }

    onboardingApi.get()
      .then(res => setState(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const completeMission = useCallback(async (mission) => {
    if (state.completedMissions.includes(mission)) return;

    // Optimistic update
    setState(prev => ({
      ...prev,
      completedMissions: [...prev.completedMissions, mission]
    }));

    try {
      const res = await onboardingApi.completeMission(mission);
      if (res.data.pointsAwarded > 0) {
        celebrate('action', 15, 'Mission complete!');
        refreshStats();
      }
      if (res.data.allComplete) {
        setTimeout(() => {
          celebrate('achievement', 25, 'System Learned!');
        }, 1500);
      }
    } catch (error) {
      // Revert on failure
      setState(prev => ({
        ...prev,
        completedMissions: prev.completedMissions.filter(m => m !== mission)
      }));
    }
  }, [state.completedMissions, celebrate, refreshStats]);

  const dismissOnboarding = useCallback(async () => {
    setState(prev => ({ ...prev, dismissed: true }));
    try {
      await onboardingApi.dismiss();
    } catch (error) {
      setState(prev => ({ ...prev, dismissed: false }));
    }
  }, []);

  const completeUnload = useCallback(async () => {
    setState(prev => ({ ...prev, unloadComplete: true }));
    try {
      await onboardingApi.completeUnload();
    } catch (error) {
      setState(prev => ({ ...prev, unloadComplete: false }));
    }
  }, []);

  const isMissionDone = useCallback((id) => {
    return state.completedMissions.includes(id);
  }, [state.completedMissions]);

  const showUnload = !loading && user && !state.unloadComplete && !state.dismissed;
  const showMissions = !loading && user && !state.dismissed &&
    state.completedMissions.length < 6;

  const value = {
    ...state,
    loading,
    showUnload,
    showMissions,
    completeMission,
    dismissOnboarding,
    completeUnload,
    isMissionDone
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
