import type { HumanCheck, HumanVerifier } from '../../application/auth/ports/HumanVerifier';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Tokens do Turnstile têm no máximo 2048 caracteres. */
const MAX_TOKEN_LENGTH = 2048;
const TIMEOUT_MS = 5000;

interface SiteverifyResponse {
  success: boolean;
  action?: string;
  'error-codes'?: string[];
}

type Fetch = typeof fetch;

/**
 * Valida o token do Cloudflare Turnstile na API Siteverify. Falha fechado:
 * token ausente, ação diferente, erro de rede ou resposta inválida = recusado.
 */
export class TurnstileVerifier implements HumanVerifier {
  constructor(
    private readonly secretKey: string,
    private readonly fetchImpl: Fetch = (input, init) => fetch(input, init),
  ) {}

  async verify({ token, action, remoteIp }: HumanCheck): Promise<boolean> {
    if (!token || token.length > MAX_TOKEN_LENGTH) return false;

    const form = new FormData();
    form.append('secret', this.secretKey);
    form.append('response', token);
    if (remoteIp) form.append('remoteip', remoteIp);

    try {
      const response = await this.fetchImpl(SITEVERIFY_URL, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return false;

      const result = (await response.json()) as SiteverifyResponse;
      if (!result.success) {
        console.warn('Turnstile rejected a token', result['error-codes']);
        return false;
      }
      // As chaves de teste não devolvem `action`; quando vem, tem de bater.
      return result.action === undefined || result.action === action;
    } catch (error) {
      console.error('Turnstile siteverify failed', error);
      return false;
    }
  }
}
