export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION';

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Um valor não respeita um invariante do modelo (formato, faixa, obrigatoriedade). */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor(message: string) {
    super(message);
  }
}

/** Credenciais ausentes, inválidas ou expiradas. */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED' as const;

  constructor(message: string) {
    super(message);
  }
}

/** O recurso endereçado não existe. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const;

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`);
  }
}

/** A operação colide com o estado atual (ex.: nome duplicado). */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const;

  constructor(message: string) {
    super(message);
  }
}

/** Os dados são válidos isoladamente, mas violam uma regra de negócio. */
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION' as const;

  constructor(message: string) {
    super(message);
  }
}
