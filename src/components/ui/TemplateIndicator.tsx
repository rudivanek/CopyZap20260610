import React from 'react';
import { Tooltip } from './Tooltip';

interface TemplateIndicatorProps {
  show: boolean;
  className?: string;
}

const TemplateIndicator: React.FC<TemplateIndicatorProps> = ({ show, className = '' }) => {
  if (!show) return null;

  return (
    <Tooltip content="This field was prefilled from a template. Review and customize for your needs.">
      <button
        type="button"
        className={`ml-2 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-bold ${className}`}
        style={{ fontSize: '14px' }}
      >
        T
      </button>
    </Tooltip>
  );
};

export default TemplateIndicator;
