import { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  size = 'md',
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const selectClasses = `
    w-full appearance-none
    bg-dark-900 border rounded-lg
    text-dark-100
    transition-all duration-200
    focus-ring cursor-pointer
    ${error ? 'border-danger-500' : 'border-dark-600 focus:border-primary-500'}
    ${sizes[size]}
  `;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-dark-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative"  style={{width: '105px'}}>
        <select
          ref={ref}
          className={`${selectClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-dark-800"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-dark-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-400">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
