import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 dark:bg-[#0b141a] dark:bg-opacity-90 z-50">
        <Loader2 className={`${sizes[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`${sizes[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
    </div>
  );
};

export default Loader;
