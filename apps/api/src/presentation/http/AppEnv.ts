import type { UseCases } from '../../main/container';
import type { Env } from '../../main/env';

export interface AppEnv {
  Bindings: Env;
  Variables: {
    useCases: UseCases;
  };
}
