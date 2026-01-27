import { motion } from 'framer-motion';
import Button from '../Button/Button';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 text-dark-500 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-dark-200 mb-1">{title}</h3>
      {description && (
        <p className="text-dark-400 max-w-sm mb-4">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action} variant="primary">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
