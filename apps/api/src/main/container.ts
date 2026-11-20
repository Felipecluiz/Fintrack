import { GetCurrentUser } from '../application/auth/GetCurrentUser';
import { LoginUser } from '../application/auth/LoginUser';
import type { HumanVerifier } from '../application/auth/ports/HumanVerifier';
import type { PasswordHasher } from '../application/auth/ports/PasswordHasher';
import type { TokenService } from '../application/auth/ports/TokenService';
import { RegisterUser } from '../application/auth/RegisterUser';
import { CreateCategory } from '../application/category/CreateCategory';
import { DeleteCategory } from '../application/category/DeleteCategory';
import { ListCategories } from '../application/category/ListCategories';
import { RenameCategory } from '../application/category/RenameCategory';
import { GetDashboardSummary } from '../application/dashboard/GetDashboardSummary';
import type { ReportReader } from '../application/dashboard/ReportReader';
import type { Clock } from '../application/ports/Clock';
import type { IdGenerator } from '../application/ports/IdGenerator';
import { CreateTransaction } from '../application/transaction/CreateTransaction';
import { DeleteTransaction } from '../application/transaction/DeleteTransaction';
import { GetTransaction } from '../application/transaction/GetTransaction';
import { ListTransactions } from '../application/transaction/ListTransactions';
import { UpdateTransaction } from '../application/transaction/UpdateTransaction';
import type { CategoryRepository } from '../domain/category/CategoryRepository';
import type { TransactionRepository } from '../domain/transaction/TransactionRepository';
import type { UserRepository } from '../domain/user/UserRepository';
import { D1CategoryRepository } from '../infrastructure/d1/D1CategoryRepository';
import { D1ReportReader } from '../infrastructure/d1/D1ReportReader';
import { D1TransactionRepository } from '../infrastructure/d1/D1TransactionRepository';
import { D1UserRepository } from '../infrastructure/d1/D1UserRepository';
import { HmacJwtTokenService } from '../infrastructure/security/HmacJwtTokenService';
import { Pbkdf2PasswordHasher } from '../infrastructure/security/Pbkdf2PasswordHasher';
import { TurnstileVerifier } from '../infrastructure/security/TurnstileVerifier';
import { CryptoIdGenerator } from '../infrastructure/system/CryptoIdGenerator';
import { SystemClock } from '../infrastructure/system/SystemClock';
import type { Env } from './env';

/** Tudo de que os casos de uso precisam, expresso apenas como portas. */
export interface Dependencies {
  categories: CategoryRepository;
  transactions: TransactionRepository;
  reports: ReportReader;
  clock: Clock;
  ids: IdGenerator;
}

export function wireUseCases(deps: Dependencies) {
  const { categories, transactions, reports, clock, ids } = deps;
  return {
    listCategories: new ListCategories(categories),
    createCategory: new CreateCategory(categories, clock, ids),
    renameCategory: new RenameCategory(categories, clock),
    deleteCategory: new DeleteCategory(categories, transactions),

    listTransactions: new ListTransactions(transactions),
    getTransaction: new GetTransaction(transactions),
    createTransaction: new CreateTransaction(transactions, categories, clock, ids),
    updateTransaction: new UpdateTransaction(transactions, categories, clock),
    deleteTransaction: new DeleteTransaction(transactions),

    getDashboardSummary: new GetDashboardSummary(reports, clock),
  };
}

export type UseCases = ReturnType<typeof wireUseCases>;

/** Dependências do módulo de autenticação (não escopado por usuário). */
export interface AuthDependencies {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  clock: Clock;
  ids: IdGenerator;
  /** Verificação anti-robô (BR-408). Ausente = desligada. */
  humans?: HumanVerifier;
}

export function wireAuth(deps: AuthDependencies) {
  const { users, hasher, tokens, clock, ids, humans } = deps;
  return {
    tokens,
    humans,
    useCases: {
      registerUser: new RegisterUser(users, hasher, tokens, clock, ids),
      loginUser: new LoginUser(users, hasher, tokens),
      getCurrentUser: new GetCurrentUser(users),
    },
  };
}

export type AuthModule = ReturnType<typeof wireAuth>;

/* ---------- Composition root de produção: o único lugar que conhece D1 ---------- */

const clock = new SystemClock();
const ids = new CryptoIdGenerator();
const hasher = new Pbkdf2PasswordHasher();

export function buildAuthModule(env: Env): AuthModule {
  return wireAuth({
    users: new D1UserRepository(env.DB),
    hasher,
    tokens: new HmacJwtTokenService(env.JWT_SECRET, clock),
    clock,
    ids,
    humans: env.TURNSTILE_SECRET_KEY ? new TurnstileVerifier(env.TURNSTILE_SECRET_KEY) : undefined,
  });
}

/**
 * Casos de uso de negócio para UM usuário: os repositórios já nascem presos ao
 * dono (BR-405), então nenhum caso de uso precisa lembrar de filtrar por usuário.
 */
export function buildUseCases(env: Env, userId: string): UseCases {
  return wireUseCases({
    categories: new D1CategoryRepository(env.DB, userId),
    transactions: new D1TransactionRepository(env.DB, userId),
    reports: new D1ReportReader(env.DB, userId),
    clock,
    ids,
  });
}
