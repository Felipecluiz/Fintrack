import { defineConfig } from 'vitest/config';

/** Testes unitários e HTTP (Node, dependências em memória). */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/integration/**', 'node_modules/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Adaptadores D1 são cobertos pelos testes de integração (vitest.integration.config.ts).
      exclude: ['src/infrastructure/d1/**', 'src/index.ts', 'src/main/**'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
