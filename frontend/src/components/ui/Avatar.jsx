import React from 'react';

const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md',
  online = false,
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };
  
  return (
    <div className={`relative ${className}`}>
      <img
        src={src || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover border-2 border-default`}
      />
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full" style={{ borderColor: 'var(--bg-panel)' }}></span>
      )}
    </div>
  );
};

export default Avatar;
