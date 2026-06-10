import React from 'react';

interface CharacterCounterProps {
  text: string;
  maxLength: number;
  targetMinLength?: number;
  targetMaxLength?: number;
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  text,
  maxLength,
  targetMinLength,
  targetMaxLength,
  className = ''
}) => {
  const currentLength = text.length;
  
  // Determine color based on character count
  const getColorClass = () => {
    // If exceeded max length, always red
    if (currentLength > maxLength) { // Changed from text-red-500
      return 'text-gray-600 dark:text-gray-500';
    }
    
    // If we have target ranges, use them
    if (targetMinLength !== undefined && targetMaxLength !== undefined) {
      if (currentLength >= targetMinLength && currentLength <= targetMaxLength) { // Changed from text-green-500
        return 'text-gray-600 dark:text-gray-400';
      } else if (currentLength >= targetMinLength * 0.8 && currentLength <= maxLength) { // Changed from text-yellow-500
        return 'text-gray-500 dark:text-gray-400';
      } else { // Changed from text-red-500
        return 'text-gray-600 dark:text-gray-500';
      }
    }
    
    // Default logic based on proximity to max
    const percentOfMax = (currentLength / maxLength) * 100;
    
    if (percentOfMax <= 70) { // Changed from text-green-500
      return 'text-gray-600 dark:text-gray-400';
    } else if (percentOfMax <= 90) { // Changed from text-yellow-500
      return 'text-gray-500 dark:text-gray-400';
    } else { // Changed from text-red-500
      return 'text-gray-600 dark:text-gray-500';
    }
  };
  
  // Build display text
  const displayText = () => {
    let text = `${currentLength}/${maxLength}`;
    
    if (targetMinLength !== undefined && targetMaxLength !== undefined) {
      text += ` (target: ${targetMinLength}-${targetMaxLength})`;
    }
    
    if (currentLength > maxLength) {
      text += ` (${currentLength - maxLength} over)`;
    }
    
    return text;
  };
  
  return (
    <span className={`text-xs font-medium ${getColorClass()} ${className}`}>
      {displayText()}
    </span>
  );
};

export default CharacterCounter;