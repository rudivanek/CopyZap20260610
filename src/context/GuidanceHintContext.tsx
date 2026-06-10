import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  subscribeToGuidanceHints,
  GuidanceHintState,
} from '../utils/guidanceHintService';

interface GuidanceHintContextType {
  currentHint: GuidanceHintState | null;
  dismissHint: () => void;
}

export const GuidanceHintContext = createContext<GuidanceHintContextType | undefined>(
  undefined
);

export const GuidanceHintProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentHint, setCurrentHint] = useState<GuidanceHintState | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGuidanceHints(setCurrentHint);
    return unsubscribe;
  }, []);

  const dismissHint = () => {
    setCurrentHint(null);
  };

  return (
    <GuidanceHintContext.Provider value={{ currentHint, dismissHint }}>
      {children}
    </GuidanceHintContext.Provider>
  );
};

export const useGuidanceHint = (): GuidanceHintContextType => {
  const context = React.useContext(GuidanceHintContext);
  if (!context) {
    throw new Error('useGuidanceHint must be used within GuidanceHintProvider');
  }
  return context;
};
