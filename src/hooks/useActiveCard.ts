import { useEffect, useState } from 'react';

export function useActiveCard(cardIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (cardIds.length === 0) return;

    const observers: IntersectionObserver[] = [];

    cardIds.forEach((id) => {
      const el = document.getElementById(`output-card-${id}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(id);
            }
          });
        },
        {
          root: null,
          rootMargin: '-20% 0px -60% 0px',
          threshold: 0,
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [cardIds.join(',')]);

  return activeId;
}
