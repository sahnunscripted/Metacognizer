export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) {
  const variants = {
    default: 'bg-dark-700 text-dark-300',
    primary: 'bg-primary-500/20 text-primary-300',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-warning-500/20 text-warning-400',
    danger: 'bg-danger-500/20 text-danger-400',
    // Context badges
    '@phone': 'bg-blue-500/20 text-blue-300',
    '@computer': 'bg-purple-500/20 text-purple-300',
    '@office': 'bg-orange-500/20 text-orange-300',
    '@errands': 'bg-green-500/20 text-green-300',
    '@home': 'bg-yellow-500/20 text-yellow-300',
    '@anywhere': 'bg-gray-500/20 text-gray-300',
    '@waiting': 'bg-red-500/20 text-red-300'
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-md
        ${variants[variant] || variants.default}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
