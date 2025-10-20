import React, { useRef } from 'react';

export default function Switch({
  checked,
  onChange,
  disabled = false,
  labelLeft = '',
  labelRight = '',
  className = '',
  size = 'md', // sm | md | lg
}) {
  const btnRef = useRef(null);

  const sizes = {
    sm: { track: 'h-5 w-10', thumb: 'h-4 w-4', translate: { on: 'translate-x-5', off: 'translate-x-1' } },
    md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: { on: 'translate-x-5', off: 'translate-x-1' } },
    lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: { on: 'translate-x-7', off: 'translate-x-1.5' } },
  }[size] || { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: { on: 'translate-x-5', off: 'translate-x-1' } };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange?.(!checked);
    }
    if (e.key === 'ArrowLeft' && checked) onChange?.(false);
    if (e.key === 'ArrowRight' && !checked) onChange?.(true);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {labelLeft ? (
        <span className={`text-sm select-none ${!checked ? 'text-primary' : 'text-secondary'}`}>{labelLeft}</span>
      ) : null}
      <button
        ref={btnRef}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        onKeyDown={onKeyDown}
        className={`relative inline-flex ${sizes.track} items-center rounded-full transition-colors focus:outline-none border ${checked ? 'bg-blue-600 border-blue-600' : 'bg-muted border-default'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <span
          className={`inline-block ${sizes.thumb} transform rounded-full bg-white shadow-sm transition-transform ${checked ? sizes.translate.on : sizes.translate.off}`}
        />
      </button>
      {labelRight ? (
        <span className={`text-sm select-none ${checked ? 'text-primary' : 'text-secondary'}`}>{labelRight}</span>
      ) : null}
    </div>
  );
}
