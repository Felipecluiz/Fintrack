import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { currentTheme } from '../../shared/ui/theme';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  theme: 'light' | 'dark';
  language: string;
  size: 'flexible';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Chave pública do widget. Vazia = verificação desligada (testes, dev sem chave). */
export function turnstileSiteKey(): string {
  return import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Carrega o script do Turnstile uma única vez, só nas telas que usam o widget. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable'));
    script.onerror = () => {
      scriptPromise = null; // permite tentar de novo numa próxima montagem
      reject(new Error('Turnstile failed to load'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Tokens valem uma vez só: depois de um envio recusado, pede um novo. */
  reset(): void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  action: string;
  /** Recebe o token quando a verificação passa e `null` quando ele expira ou falha. */
  onToken: (token: string | null) => void;
}

/** Verificação anti-robô do Cloudflare Turnstile (BR-408). */
export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, action, onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;
    const [loadFailed, setLoadFailed] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          onTokenRef.current(null);
          if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
        },
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;
      loadTurnstile()
        .then((api) => {
          if (cancelled || !containerRef.current) return;
          widgetIdRef.current = api.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme: currentTheme(),
            language: 'pt-br',
            size: 'flexible',
            callback: (token) => onTokenRef.current(token),
            'expired-callback': () => onTokenRef.current(null),
            'error-callback': () => onTokenRef.current(null),
          });
        })
        .catch(() => {
          if (!cancelled) setLoadFailed(true);
        });

      return () => {
        cancelled = true;
        if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      };
    }, [siteKey, action]);

    return (
      <div className="turnstile">
        <div ref={containerRef} />
        {loadFailed && (
          <small className="field__error" role="alert">
            A verificação anti-robô não carregou. Confira sua conexão e recarregue a página.
          </small>
        )}
      </div>
    );
  },
);
