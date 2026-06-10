import React from 'react';
import { cn } from '../../lib/utils';

interface GradientSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Circular spinner with orange-to-coral gradient (#ff6b35 to #ffa07a)
 * Used consistently across all loading states in the application
 */
const GradientSpinner: React.FC<GradientSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <svg className={cn('animate-spin', sizeClasses[size], className)} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" role="status">
      <defs>
        <linearGradient id="spinnerGradientGeneric" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ffa07a" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#spinnerGradientGeneric)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="90, 150"
        strokeDashoffset="0"
      />
      <span className="sr-only">Loading...</span>
    </svg>
  );
};

export default GradientSpinner;
