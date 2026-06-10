import React from 'react';
import { Tooltip } from './Tooltip';

const RequiredFieldIndicator: React.FC = () => {
  return (
    <Tooltip content="This field is required" delayDuration={300}>
      <span className="text-orange-500 ml-1 cursor-help">*</span>
    </Tooltip>
  );
};

export default RequiredFieldIndicator;
