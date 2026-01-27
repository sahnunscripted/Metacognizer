import { createContext, useContext, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

const CelebrationContext = createContext();

export function CelebrationProvider({ children }) {
  const [celebration, setCelebration] = useState(null);

  const celebrate = useCallback((type = 'action', points = 0, message = '') => {
    // Set celebration state for UI feedback
    setCelebration({ type, points, message });

    // Trigger confetti based on celebration type
    switch (type) {
      case 'action':
        // Small burst for completing an action
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#6366f1', '#818cf8', '#a5b4fc']
        });
        break;

      case 'quickAction':
        // Quick subtle burst for 2-minute rule
        confetti({
          particleCount: 15,
          spread: 30,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });
        break;

      case 'project':
        // Big celebration for completing a project
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#10b981', '#fbbf24']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6366f1', '#10b981', '#fbbf24']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
        break;

      case 'streak':
        // Fire emoji style for streaks
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f97316', '#fbbf24']
        });
        break;

      case 'achievement':
        // Stars for achievements
        const defaults = {
          spread: 360,
          ticks: 100,
          gravity: 0,
          decay: 0.94,
          startVelocity: 30,
          shapes: ['star'],
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        };

        confetti({
          ...defaults,
          particleCount: 30,
          scalar: 1.2,
          origin: { x: 0.5, y: 0.5 }
        });
        break;

      case 'inboxZero':
        // Rainbow celebration for inbox zero
        const colors = ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6'];
        colors.forEach((color, i) => {
          setTimeout(() => {
            confetti({
              particleCount: 20,
              spread: 60,
              origin: { x: 0.5, y: 0.5 },
              colors: [color]
            });
          }, i * 100);
        });
        break;

      default:
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.7 }
        });
    }

    // Clear celebration state after animation
    setTimeout(() => {
      setCelebration(null);
    }, 2000);
  }, []);

  const value = {
    celebration,
    celebrate
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
