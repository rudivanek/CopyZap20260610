import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const colorClasses = {
    primary: 'text-gray-500',
    white: 'text-white',
    gray: 'text-gray-700 dark:text-gray-300'
  };

  return (
    <svg className={cn('animate-spin', sizeClasses[size], className)} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" role="status">
      <defs>
        <linearGradient id="spinnerGradientLoading" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ffa07a" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#spinnerGradientLoading)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="90, 150"
        strokeDashoffset="0"
      />
      <span className="sr-only">Loading...</span>
    </svg>
  );
};

export default LoadingSpinner;