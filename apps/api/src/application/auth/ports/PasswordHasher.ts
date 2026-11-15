export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /**
   * Com `storedHash = null` a implementação deve gastar o mesmo tempo de uma
   * verificação real e devolver `false` — evita revelar, pelo tempo de
   * resposta, se um e-mail está cadastrado (BR-407).
   */
  verify(password: string, storedHash: string | null): Promise<boolean>;
}
