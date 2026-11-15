import type { PasswordHasher } from '../../application/auth/ports/PasswordHasher';
import { base64ToBytes, bytesToBase64, timingSafeEqual, utf8 } from './encoding';

/** 100.000 é o máximo de iterações PBKDF2 aceito pelo runtime do Workers. */
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const SCHEME = 'pbkdf2-sha256';

/**
 * Formato armazenado: `pbkdf2-sha256$<iterações>$<salt base64>$<hash base64>`.
 * Guardar as iterações no próprio hash permite aumentá-las no futuro sem
 * invalidar senhas antigas.
 */
export class Pbkdf2PasswordHasher implements PasswordHasher {
  constructor(private readonly iterations = ITERATIONS) {}

  async hash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const derived = await derive(password, salt, this.iterations);
    return [SCHEME, this.iterations, bytesToBase64(salt), bytesToBase64(derived)].join('$');
  }

  async verify(password: string, storedHash: string | null): Promise<boolean> {
    const parsed = storedHash ? parse(storedHash) : null;
    if (!parsed) {
      // Mesmo custo de uma verificação real (BR-407).
      await derive(password, new Uint8Array(SALT_BYTES), this.iterations);
      return false;
    }
    const derived = await derive(password, parsed.salt, parsed.iterations);
    return timingSafeEqual(derived, parsed.hash);
  }
}

interface ParsedHash {
  iterations: number;
  salt: Uint8Array<ArrayBuffer>;
  hash: Uint8Array<ArrayBuffer>;
}

function parse(stored: string): ParsedHash | null {
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== SCHEME || !iterations || !salt || !hash) return null;
  return { iterations: Number(iterations), salt: base64ToBytes(salt), hash: base64ToBytes(hash) };
}

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey('raw', utf8(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}
