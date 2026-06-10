import React from 'react';
import { GuidanceToast } from './GuidanceToast';
import { useGuidanceHint } from '../../context/GuidanceHintContext';

export const GuidanceHintHost: React.FC = () => {
  const { currentHint, dismissHint } = useGuidanceHint();

  if (!currentHint) {
    return null;
  }

  return (
    <GuidanceToast
      text={currentHint.text}
      durationMs={currentHint.durationMs}
      visible={true}
      onDismiss={dismissHint}
    />
  );
};
