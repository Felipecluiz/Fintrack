import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.wrangler/**', '**/node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Constituição, princípio II: o domínio não conhece o mundo externo.
    files: ['apps/api/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['hono', 'hono/*', 'zod', '@fintrack/*'],
              message: 'domain must not depend on frameworks or contracts',
            },
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/presentation/**',
                '**/main/**',
              ],
              message: 'domain must not depend on outer layers',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['hono', 'hono/*'],
              message: 'application must not depend on the HTTP framework',
            },
            {
              group: ['**/infrastructure/**', '**/presentation/**', '**/main/**'],
              message: 'application must not depend on outer layers',
            },
          ],
        },
      ],
    },
  },
);
