import type { HumanVerifier } from '../../src/application/auth/ports/HumanVerifier';
import { createApp } from '../../src/presentation/http/createApp';
import { createAuthTestContext, createTestContext, FixedClock, type TestContext } from './fakes';

/**
 * App HTTP completo com dependências em memória e um "banco" separado por
 * usuário — espelha os repositórios D1 escopados por dono.
 */
export function createTestApp({ humans }: { humans?: HumanVerifier } = {}) {
  const authContext = createAuthTestContext(new FixedClock(), humans);
  const contexts = new Map<string, TestContext>();
  const contextFor = (userId: string) => {
    const existing = contexts.get(userId);
    if (existing) return existing;
    // Prefixo diferente por usuário: ids nunca coincidem entre "bancos".
    const created = createTestContext(String(contexts.size + 1));
    contexts.set(userId, created);
    return created;
  };

  const app = createApp({
    authFor: () => authContext.auth,
    useCasesFor: (_env, userId) => contextFor(userId).useCases,
  });

  return { app, authContext, contextFor };
}
