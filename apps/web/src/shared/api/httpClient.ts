import type { ApiErrorBody } from '@fintrack/contracts';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!response.ok) {
    throw await toApiRequestError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function jsonBody(data: unknown): Pick<RequestInit, 'body'> {
  return { body: JSON.stringify(data) };
}

export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function toApiRequestError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiRequestError(
      response.status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  } catch {
    return new ApiRequestError(
      response.status,
      'UNKNOWN',
      `Request failed with status ${response.status}`,
    );
  }
}
