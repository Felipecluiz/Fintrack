import { useLayoutEffect, useRef, useState } from 'react';

/** Distância do topo em que o conteúdo "gruda" (altura da barra de navegação). */
const STICKY_TOP = 64;

/**
 * - `sticky`: o primeiro filho do elemento fica grudado enquanto o elemento
 *   (o "trilho") rola. 0 quando o trilho chega ao topo, 1 quando ele acaba.
 *   Só no desktop, onde há espaço para a cena ficar parada.
 * - `pass`: o elemento só atravessa a tela. 0 quando o topo dele aparece no
 *   rodapé da janela, 1 quando chega a 30% da altura. Funciona em qualquer tela.
 */
export type ScrollMode = 'sticky' | 'pass';

const ENABLED_QUERY: Record<ScrollMode, string> = {
  sticky: '(min-width: 961px) and (prefers-reduced-motion: no-preference)',
  pass: '(prefers-reduced-motion: no-preference)',
};

/** No modo `pass`, a animação termina quando o topo chega a esta fração da janela. */
const PASS_END = 0.3;

export interface ScrollProgress {
  /** `false` = mostra o estado final, sem depender da rolagem. */
  enabled: boolean;
  /** 0 no início do trecho, 1 no fim. */
  progress: number;
}

const STATIC: ScrollProgress = { enabled: false, progress: 1 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function measureSticky(track: HTMLElement): number {
  const sticky = track.firstElementChild as HTMLElement | null;
  const scrollable = track.offsetHeight - (sticky?.offsetHeight ?? 0);
  return scrollable > 0 ? (STICKY_TOP - track.getBoundingClientRect().top) / scrollable : 1;
}

function measurePass(element: HTMLElement): number {
  const viewport = window.innerHeight;
  return (viewport - element.getBoundingClientRect().top) / (viewport * (1 - PASS_END));
}

/**
 * Converte a rolagem num progresso 0–1 para o elemento retornado em `ref`.
 * Atualiza no máximo uma vez por frame e respeita `prefers-reduced-motion`.
 */
export function useScrollProgress<T extends HTMLElement>(mode: ScrollMode = 'sticky') {
  const ref = useRef<T>(null);
  const [state, setState] = useState<ScrollProgress>(STATIC);

  // Layout effect: o primeiro estado já sai medido, sem "piscar" o estado final.
  useLayoutEffect(() => {
    const element = ref.current;
    const media = window.matchMedia?.(ENABLED_QUERY[mode]);
    if (!element || !media) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!media.matches) {
        setState((current) => (current.enabled ? STATIC : current));
        return;
      }
      const progress = clamp01(mode === 'sticky' ? measureSticky(element) : measurePass(element));
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
  }, [mode]);

  return [ref, state] as const;
}
