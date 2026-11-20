import type { AuthResponseDTO, LoginInput, RegisterInput } from '@fintrack/contracts';
import { http, jsonBody } from '../../shared/api/httpClient';

export const authApi = {
  /** `humanToken`: token do Turnstile, quando a verificação anti-robô está ligada. */
  register: (input: RegisterInput, humanToken?: string) =>
    http<AuthResponseDTO>('/api/auth/register', {
      method: 'POST',
      ...jsonBody(input),
      ...(humanToken ? { headers: { 'X-Turnstile-Token': humanToken } } : {}),
    }),

  login: (input: LoginInput) =>
    http<AuthResponseDTO>('/api/auth/login', { method: 'POST', ...jsonBody(input) }),
};

/** Conta de demonstração criada pelo seed (`apps/api/seeds/demo.sql`). */
export const DEMO_CREDENTIALS: LoginInput = {
  email: 'demo@fintrack.dev',
  password: 'demo1234',
};
