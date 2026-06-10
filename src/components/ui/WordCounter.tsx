import React from 'react';

interface WordCounterProps {
  text: string;
  className?: string;
}

const WordCounter: React.FC<WordCounterProps> = ({
  text,
  className = ''
}) => {
  // Count words by splitting on whitespace and filtering out empty strings
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <span className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {wordCount} {wordCount === 1 ? 'word' : 'words'}
    </span>
  );
};

export default WordCounter;
