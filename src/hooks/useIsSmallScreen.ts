import { useState, useEffect } from 'react';

export const useIsSmallScreen = (minWidth: number): boolean | null => {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < minWidth);
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [minWidth]);

  return isSmallScreen;
};
