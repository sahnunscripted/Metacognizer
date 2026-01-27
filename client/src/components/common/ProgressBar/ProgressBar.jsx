import { motion } from 'framer-motion';

export default function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  animate = true,
  className = ''
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    gradient: 'bg-gradient-to-r from-primary-500 via-success-500 to-primary-500'
  };

  const glowColors = {
    primary: 'shadow-primary-500/50',
    success: 'shadow-success-500/50',
    warning: 'shadow-warning-500/50',
    danger: 'shadow-danger-500/50',
    gradient: 'shadow-primary-500/50'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-dark-400">{label || 'Progress'}</span>
          <span className="text-dark-300 font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-dark-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          className={`h-full rounded-full ${colors[color]} ${percentage > 50 ? `shadow-lg ${glowColors[color]}` : ''}`}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
