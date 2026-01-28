import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../context/OnboardingContext';
import { Card, ProgressBar } from '../common';

const MISSIONS = [
  {
    id: 'dump',
    name: 'Dump a thought',
    description: "Your brain's not a filing cabinet. Get it out.",
    nav: '/braindump'
  },
  {
    id: 'process',
    name: 'Process one',
    description: 'Pick a thought. Decide what to do about it.',
    nav: '/braindump'
  },
  {
    id: 'action',
    name: 'Finish something',
    description: 'Complete any action. Even a tiny one counts.',
    nav: '/'
  },
  {
    id: 'inbox',
    name: 'Clear your inbox',
    description: 'Got stuff coming at you? Process one item.',
    nav: '/inbasket'
  },
  {
    id: 'project',
    name: 'Start a project',
    description: 'Something bigger than one step? Make it a project.',
    nav: '/projects'
  },
  {
    id: 'someday',
    name: 'Park an idea',
    description: 'Not everything is urgent. Save it for later.',
    nav: '/someday'
  }
];

export default function GettingStartedCard() {
  const { showMissions, completedMissions, dismissOnboarding } = useOnboarding();
  const navigate = useNavigate();

  if (!showMissions) return null;

  const doneCount = completedMissions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
    >
      <Card variant="default" padding="sm" className="border-primary-500/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-dark-100">Getting Started</span>
            <span className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded-full">
              {doneCount}/{MISSIONS.length}
            </span>
          </div>
          <button
            onClick={dismissOnboarding}
            className="text-xs text-dark-500 hover:text-dark-400 transition-colors"
          >
            I've got this
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <ProgressBar value={doneCount} max={MISSIONS.length} size="sm" />
        </div>

        {/* Missions */}
        <div className="space-y-1">
          {MISSIONS.map((mission) => {
            const done = completedMissions.includes(mission.id);
            return (
              <motion.button
                key={mission.id}
                layout
                onClick={() => !done && navigate(mission.nav)}
                disabled={done}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  done
                    ? 'opacity-50'
                    : 'hover:bg-dark-700/50 active:scale-[0.98]'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  done
                    ? 'bg-success-500 border-success-500'
                    : 'border-dark-600'
                }`}>
                  {done && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'text-dark-500 line-through' : 'text-dark-200'}`}>
                    {mission.name}
                  </p>
                  <p className={`text-xs truncate ${done ? 'text-dark-600' : 'text-dark-500'}`}>
                    {mission.description}
                  </p>
                </div>

                {/* Arrow for incomplete */}
                {!done && (
                  <svg className="w-4 h-4 text-dark-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}

                {/* Points badge for incomplete */}
                {!done && (
                  <span className="text-[10px] font-medium text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    +15
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
