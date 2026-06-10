import React from 'react';
import { Zap } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isLoading, isDisabled }) => {
  return (
    <button
      type="button"
      data-generate-button
      className="w-full text-white font-medium border border-gray-300 dark:border-gray-700 text-base px-5 py-3.5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
      style={{
        backgroundColor: isLoading || isDisabled ? '#ff6b35' : '#ff6b35',
        opacity: isLoading || isDisabled ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !isDisabled) {
          e.currentTarget.style.backgroundColor = '#e5602f';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading && !isDisabled) {
          e.currentTarget.style.backgroundColor = '#ff6b35';
        }
      }}
      onMouseDown={(e) => {
        if (!isLoading && !isDisabled) {
          e.currentTarget.style.backgroundColor = '#cc552a';
        }
      }}
      onMouseUp={(e) => {
        if (!isLoading && !isDisabled) {
          e.currentTarget.style.backgroundColor = '#e5602f';
        }
      }}
      onClick={onClick}
      disabled={isLoading || isDisabled}
    >
      {isLoading ? (
        <>
          Generating...
        </>
      ) : (
        <>
          <Zap size={16} className="mr-1.5" style={{ marginRight: '6px' }} />
          {window.location.pathname === '/copy-maker' ? 'Make Copy' : 'Generate Copy'}
        </>
      )}
    </button>
  );
};

export default GenerateButton;