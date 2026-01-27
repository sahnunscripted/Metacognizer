import { motion } from 'framer-motion';

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  animate = true,
  ...props
}) {
  const variants = {
    default: 'bg-dark-800 border border-dark-700',
    glass: 'glass',
    elevated: 'bg-dark-800 border border-dark-700 shadow-lg shadow-dark-950/50',
    interactive: 'bg-dark-800 border border-dark-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    whileHover: onClick ? { scale: 1.01 } : undefined,
    whileTap: onClick ? { scale: 0.99 } : undefined
  } : {};

  return (
    <Component
      onClick={onClick}
      className={`
        rounded-xl
        ${variants[variant]}
        ${paddings[padding]}
        ${onClick ? 'transition-all duration-200' : ''}
        ${className}
      `}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
}
