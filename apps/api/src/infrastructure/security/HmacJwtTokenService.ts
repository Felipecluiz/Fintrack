import type { IssuedToken, TokenService } from '../../application/auth/ports/TokenService';
import type { Clock } from '../../application/ports/Clock';
import { base64UrlToBytes, bytesToBase64Url, utf8 } from './encoding';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
const HEADER = bytesToBase64Url(utf8(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));

interface Claims {
  sub: string;
  iat: number;
  exp: number;
}

/** JWT HS256 com WebCrypto — sem dependências externas (BR-404). */
export class HmacJwtTokenService implements TokenService {
  private keyPromise: Promise<CryptoKey> | null = null;

  constructor(
    private readonly secret: string | undefined,
    private readonly clock: Clock,
    private readonly ttlSeconds = SEVEN_DAYS_IN_SECONDS,
  ) {}

  async issue(userId: string): Promise<IssuedToken> {
    const issuedAt = Math.floor(this.clock.now().getTime() / 1000);
    const claims: Claims = { sub: userId, iat: issuedAt, exp: issuedAt + this.ttlSeconds };
    const signingInput = `${HEADER}.${bytesToBase64Url(utf8(JSON.stringify(claims)))}`;
    const signature = await crypto.subtle.sign('HMAC', await this.key(), utf8(signingInput));

    return {
      token: `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`,
      expiresAt: new Date(claims.exp * 1000),
    };
  }

  async verify(token: string): Promise<string | null> {
    const [header, payload, signature] = token.split('.');
    if (header !== HEADER || !payload || !signature) return null;

    try {
      const isValid = await crypto.subtle.verify(
        'HMAC',
        await this.key(),
        base64UrlToBytes(signature),
        utf8(`${header}.${payload}`),
      );
      if (!isValid) return null;

      const claims = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as Partial<Claims>;
      const now = Math.floor(this.clock.now().getTime() / 1000);
      if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || claims.exp <= now) {
        return null;
      }
      return claims.sub;
    } catch {
      return null; // base64 ou JSON malformado
    }
  }

  private key(): Promise<CryptoKey> {
    if (!this.secret || this.secret.length < MIN_SECRET_LENGTH) {
      // Falha fechada: sem segredo adequado, ninguém autentica.
      return Promise.reject(
        new Error(`JWT_SECRET must be configured with at least ${MIN_SECRET_LENGTH} characters`),
      );
    }
    if (!this.keyPromise) {
      this.keyPromise = crypto.subtle.importKey(
        'raw',
        utf8(this.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
      );
    }
    return this.keyPromise;
  }
}
