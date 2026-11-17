import { useLayoutEffect, useRef, useState } from 'react';

/** Distância do topo em que o conteúdo "gruda" (altura da barra de navegação). */
const STICKY_TOP = 64;

/** Só no desktop e para quem não pediu menos movimento. */
const ENABLED_QUERY = '(min-width: 961px) and (prefers-reduced-motion: no-preference)';

export interface ScrollProgress {
  /** `false` = mostra o estado final, sem depender da rolagem. */
  enabled: boolean;
  /** 0 no início do trecho, 1 no fim. */
  progress: number;
}

const STATIC: ScrollProgress = { enabled: false, progress: 1 };

/**
 * Mede quanto do "trilho" (o elemento retornado) já foi rolado enquanto o
 * primeiro filho fica grudado (`position: sticky`). Atualiza uma vez por frame.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<ScrollProgress>(STATIC);

  // Layout effect: o primeiro estado já sai medido, sem "piscar" o estado final.
  useLayoutEffect(() => {
    const track = ref.current;
    const media = window.matchMedia?.(ENABLED_QUERY);
    if (!track || !media) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!media.matches) {
        setState((current) => (current.enabled ? STATIC : current));
        return;
      }
      const sticky = track.firstElementChild as HTMLElement | null;
      const scrollable = track.offsetHeight - (sticky?.offsetHeight ?? 0);
      const raw = scrollable > 0 ? (STICKY_TOP - track.getBoundingClientRect().top) / scrollable : 1;
      const progress = Math.min(1, Math.max(0, raw));
      setState((current) =>
        current.enabled && Math.abs(current.progress - progress) < 0.002
          ? current
          : { enabled: true, progress },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener?.('change', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener?.('change', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return [ref, state] as const;
}
