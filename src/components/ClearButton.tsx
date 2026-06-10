import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ClearButtonProps {
  onClick: () => void;
  isDisabled: boolean;
}

const ClearButton: React.FC<ClearButtonProps> = ({ onClick, isDisabled }) => {
  return (
    <button
      type="button"
      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-base px-5 py-3 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      onClick={onClick}
      disabled={isDisabled}
    >
      <RefreshCw size={18} className="mr-2 text-gray-700 dark:text-gray-300" />
      Clear All
    </button>
  );
};

export default ClearButton;