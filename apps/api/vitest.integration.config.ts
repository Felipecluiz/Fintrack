import path from 'node:path';
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

/**
 * Testes de integração dentro do runtime real do Workers (workerd), com um D1
 * local e as migrations aplicadas — validam o SQL dos repositórios.
 */
export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.resolve('migrations'));

  return {
    test: {
      include: ['test/integration/**/*.test.ts'],
      setupFiles: ['./test/integration/applyMigrations.ts'],
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: { configPath: './wrangler.toml' },
          miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
        },
      },
    },
  };
});
