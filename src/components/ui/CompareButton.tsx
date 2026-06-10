import React from 'react';
import { Scale } from 'lucide-react';

interface CompareButtonProps {
  onClick: () => void;
  isComparing?: boolean;
}

const CompareButton: React.FC<CompareButtonProps> = ({ onClick, isComparing = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={isComparing}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed p-4 shadow-lg border border-gray-700 dark:border-gray-300 transition-all duration-200"
      title="Compare all outputs"
    >
      <Scale className={`h-6 w-6 ${isComparing ? 'animate-pulse' : ''}`} />
    </button>
  );
};

export default CompareButton;
