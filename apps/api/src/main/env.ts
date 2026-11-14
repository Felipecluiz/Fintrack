export interface Env {
  DB: D1Database;
  /** Origens permitidas no CORS, separadas por vírgula. */
  ALLOWED_ORIGINS: string;
}
