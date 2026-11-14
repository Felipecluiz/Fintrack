import { useEffect, useRef, useState } from 'react';

/** Largura de um elemento, atualizada quando ele é redimensionado. */
export function useElementWidth<T extends HTMLElement>(initialWidth = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initialWidth);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
