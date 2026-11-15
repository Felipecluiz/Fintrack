export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export interface TokenService {
  issue(userId: string): Promise<IssuedToken>;
  /** Devolve o id do usuário, ou `null` se o token for inválido ou estiver expirado. */
  verify(token: string): Promise<string | null>;
}
