/** Formato mínimo do binding de Rate Limiting do Workers que usamos. */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  DB: D1Database;
  /** Origens permitidas no CORS, separadas por vírgula (aceita `https://*.dominio`). */
  ALLOWED_ORIGINS: string;
  /** Segredo do JWT (≥ 32 caracteres). Em produção: `wrangler secret put JWT_SECRET`. */
  JWT_SECRET?: string;
  /** Opcional: sem o binding (dev/testes), o limite simplesmente não é aplicado. */
  AUTH_RATE_LIMITER?: RateLimiter;
}
