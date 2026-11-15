import { applyD1Migrations, env } from 'cloudflare:test';

// Cada arquivo de teste recebe um D1 isolado; as migrations são idempotentes.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
