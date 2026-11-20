export interface HumanCheck {
  /** Token gerado pelo desafio no navegador. */
  token: string;
  /** Ação esperada (o widget é criado com a mesma ação). */
  action: string;
  /** IP de quem fez a requisição, quando conhecido. */
  remoteIp?: string;
}

/** Confirma que um formulário foi enviado por uma pessoa (BR-408). */
export interface HumanVerifier {
  verify(check: HumanCheck): Promise<boolean>;
}
