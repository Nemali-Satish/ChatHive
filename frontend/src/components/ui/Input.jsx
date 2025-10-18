import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-primary mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-secondary" />
          </div>
        )}
        <input
          className={`input-field ${Icon ? 'input-with-icon' : ''} ${className}`}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            tabIndex={-1}
          >
            <RightIcon className="h-5 w-5 text-secondary" />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{error}</p>
      )}
    </div>
  );
};

export default Input;
