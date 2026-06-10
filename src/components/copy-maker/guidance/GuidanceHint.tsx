import React from 'react';
import { Lightbulb } from 'lucide-react';

interface GuidanceHintProps {
  text: string;
  className?: string;
}

const GuidanceHint: React.FC<GuidanceHintProps> = ({ text, className = '' }) => (
  <p className={`flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1.5 ${className}`}>
    <Lightbulb size={11} className="shrink-0 text-gray-300 dark:text-gray-600" />
    {text}
  </p>
);

export default GuidanceHint;
