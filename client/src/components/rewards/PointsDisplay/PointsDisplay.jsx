import { motion, AnimatePresence } from 'framer-motion';
import { useStats } from '../../../context/StatsContext';
import { useCelebration } from '../../../context/CelebrationContext';

export default function PointsDisplay({ compact = false }) {
  const { totalPoints, currentStreak, totalActionsCompleted } = useStats();
  const { celebration } = useCelebration();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={totalPoints}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1.5 bg-primary-500/20 text-primary-300 px-3 py-1 rounded-full"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold">{totalPoints}</span>
          </motion.div>
        </AnimatePresence>

        {currentStreak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-warning-400"
          >
            <span className="text-lg">🔥</span>
            <span className="font-semibold text-sm">{currentStreak}</span>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Total Points */}
      <motion.div
        className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center"
        whileHover={{ scale: 1.02 }}
      >
        <div className="text-primary-400 mb-1">
          <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.p
            key={totalPoints}
            initial={{ scale: 1.2, color: '#a5b4fc' }}
            animate={{ scale: 1, color: '#f1f5f9' }}
            className="text-2xl font-bold text-dark-100"
          >
            {totalPoints}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-dark-400">Points</p>
      </motion.div>

      {/* Current Streak */}
      <motion.div
        className={`bg-dark-800 border rounded-xl p-4 text-center ${
          currentStreak >= 7 ? 'border-warning-500/50 glow-primary' : 'border-dark-700'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="text-2xl mb-1">🔥</div>
        <p className="text-2xl font-bold text-dark-100">{currentStreak}</p>
        <p className="text-xs text-dark-400">Day Streak</p>
      </motion.div>

      {/* Actions Completed */}
      <motion.div
        className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center"
        whileHover={{ scale: 1.02 }}
      >
        <div className="text-success-400 mb-1">
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-dark-100">{totalActionsCompleted}</p>
        <p className="text-xs text-dark-400">Completed</p>
      </motion.div>

      {/* Points animation overlay */}
      <AnimatePresence>
        {celebration && celebration.points > 0 && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                       text-2xl font-bold text-primary-400 pointer-events-none z-50"
          >
            +{celebration.points}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
