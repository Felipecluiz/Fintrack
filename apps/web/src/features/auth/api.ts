import type { AuthResponseDTO, LoginInput, RegisterInput } from '@fintrack/contracts';
import { http, jsonBody } from '../../shared/api/httpClient';

export const authApi = {
  register: (input: RegisterInput) =>
    http<AuthResponseDTO>('/api/auth/register', { method: 'POST', ...jsonBody(input) }),

  login: (input: LoginInput) =>
    http<AuthResponseDTO>('/api/auth/login', { method: 'POST', ...jsonBody(input) }),
};

/** Conta de demonstração criada pelo seed (`apps/api/seeds/demo.sql`). */
export const DEMO_CREDENTIALS: LoginInput = {
  email: 'demo@fintrack.dev',
  password: 'demo1234',
};
