import type { AuthModule, UseCases } from '../../main/container';
import type { Env } from '../../main/env';

export interface AppEnv {
  Bindings: Env;
  Variables: {
    auth: AuthModule;
    /** Definidos por `requireAuth` nas rotas protegidas. */
    userId: string;
    useCases: UseCases;
  };
}
