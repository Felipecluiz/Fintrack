import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Configuração de testes separada do vite.config.ts: o Vitest 2 embute os
 * tipos do Vite 5 e o app usa Vite 6, então misturar os dois num só arquivo
 * quebra o typecheck. Este arquivo fica fora do `tsconfig.json` de propósito.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
        reporter: ['text', 'json-summary', 'html'],
      },
    },
  }),
);
