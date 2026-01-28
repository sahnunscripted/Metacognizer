import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isPast, isToday } from 'date-fns';
import { Card, Badge, Button } from '../../common';
import { useCelebration } from '../../../context/CelebrationContext';
import { useStats } from '../../../context/StatsContext';
import { actionsApi } from '../../../services/api';

export default function ActionItem({ action, onUpdate, onDelete, onClick }) {
  const [completing, setCompleting] = useState(false);
  const { celebrate } = useCelebration();
  const { refreshStats } = useStats();

  const handleComplete = async (e) => {
    e.stopPropagation();
    if (completing || action.status === 'completed') return;

    setCompleting(true);
    try {
      const response = await actionsApi.complete(action._id);
      const { pointsAwarded } = response.data;

      // Trigger celebration
      celebrate(
        action.isQuickAction ? 'quickAction' : 'action',
        pointsAwarded,
        `+${pointsAwarded} points!`
      );

      refreshStats();
      onUpdate?.(response.data.action);
    } catch (error) {
      console.error('Failed to complete action:', error);
    } finally {
      setCompleting(false);
    }
  };

  const isOverdue = action.deadline && isPast(new Date(action.deadline)) && action.status === 'active';
  const isDueToday = action.deadline && isToday(new Date(action.deadline));

  return (
    <Card
      variant="interactive"
      padding="none"
      onClick={onClick}
      className={`
        overflow-hidden
        ${action.status === 'completed' ? 'opacity-60' : ''}
        ${isOverdue ? 'border-danger-500/50' : ''}
        ${isDueToday && !isOverdue ? 'border-warning-500/50' : ''}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Completion checkbox */}
        <motion.button
          onClick={handleComplete}
          disabled={completing || action.status === 'completed'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`
            flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2
            flex items-center justify-center
            transition-all duration-200 touch-target
            ${action.status === 'completed'
              ? 'bg-success-500 border-success-500 text-white'
              : 'border-dark-500 hover:border-primary-500 hover:bg-primary-500/10'
            }
          `}
        >
          {action.status === 'completed' && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
          {completing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full"
            />
          )}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium ${action.status === 'completed' ? 'line-through text-dark-400' : 'text-dark-100'}`}>
              {action.title}
            </h3>
            {action.isQuickAction && (
              <Badge variant="success" size="sm" className="flex-shrink-0">
                2 min
              </Badge>
            )}
          </div>

          {action.description && (
            <p className="text-sm text-dark-400 mt-1 line-clamp-2">{action.description}</p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={action.context} size="sm">
              {action.context}
            </Badge>

            {action.recurringActionId && (
              <Badge variant="primary" size="sm">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Recurring
                </span>
              </Badge>
            )}

            {action.deadline && (
              <span className={`text-xs ${isOverdue ? 'text-danger-400' : isDueToday ? 'text-warning-400' : 'text-dark-500'}`}>
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due: ' : ''}
                {format(new Date(action.deadline), 'MMM d')}
              </span>
            )}

            {action.project && (
              <span className="text-xs text-primary-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {action.project.title}
              </span>
            )}

            {action.status === 'waiting' && action.waitingFor && (
              <span className="text-xs text-warning-400">
                Waiting: {action.waitingFor}
              </span>
            )}
          </div>
        </div>

        {/* Priority indicator */}
        {action.priority <= 2 && action.status !== 'completed' && (
          <div className={`w-1.5 h-full absolute right-0 top-0 ${action.priority === 1 ? 'bg-danger-500' : 'bg-warning-500'}`} />
        )}
      </div>
    </Card>
  );
}
