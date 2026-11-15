import { describe, expect, it } from 'vitest';
import { HmacJwtTokenService } from '../../src/infrastructure/security/HmacJwtTokenService';
import { Pbkdf2PasswordHasher } from '../../src/infrastructure/security/Pbkdf2PasswordHasher';
import { FixedClock, TEST_JWT_SECRET } from '../support/fakes';

// Poucas iterações só para o teste ser rápido; produção usa 100.000.
const hasher = new Pbkdf2PasswordHasher(1_000);

describe('Pbkdf2PasswordHasher', () => {
  it('AC-412: verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash('segredo123');

    expect(hash).toMatch(/^pbkdf2-sha256\$1000\$/);
    expect(hash).not.toContain('segredo123');
    await expect(hasher.verify('segredo123', hash)).resolves.toBe(true);
    await expect(hasher.verify('segredo124', hash)).resolves.toBe(false);
  });

  it('AC-412: uses a random salt (same password, different hashes)', async () => {
    const [a, b] = await Promise.all([hasher.hash('segredo123'), hasher.hash('segredo123')]);
    expect(a).not.toBe(b);
  });

  it('BR-407: rejects a missing or malformed hash without throwing', async () => {
    await expect(hasher.verify('segredo123', null)).resolves.toBe(false);
    await expect(hasher.verify('segredo123', 'md5$abc')).resolves.toBe(false);
  });
});

describe('HmacJwtTokenService', () => {
  const userId = '00000000-0000-4000-8000-000000000001';

  it('BR-404: issues a token that verifies back to the user id', async () => {
    const tokens = new HmacJwtTokenService(TEST_JWT_SECRET, new FixedClock());
    const { token, expiresAt } = await tokens.issue(userId);

    expect(expiresAt.toISOString()).toBe('2026-11-20T12:00:00.000Z');
    await expect(tokens.verify(token)).resolves.toBe(userId);
  });

  it('AC-407: rejects an expired token', async () => {
    const clock = new FixedClock();
    const tokens = new HmacJwtTokenService(TEST_JWT_SECRET, clock);
    const { token } = await tokens.issue(userId);

    clock.set('2026-11-20T12:00:01.000Z');
    await expect(tokens.verify(token)).resolves.toBeNull();
  });

  it('AC-407: rejects a tampered payload or a token signed with another secret', async () => {
    const tokens = new HmacJwtTokenService(TEST_JWT_SECRET, new FixedClock());
    const other = new HmacJwtTokenService('another-secret-with-at-least-32-chars!!', new FixedClock());
    const { token } = await tokens.issue(userId);
    const [header, , signature] = token.split('.');
    const forgedPayload = btoa(JSON.stringify({ sub: 'attacker', iat: 0, exp: 9_999_999_999 }))
      .replace(/=+$/, '');

    await expect(tokens.verify(`${header}.${forgedPayload}.${signature}`)).resolves.toBeNull();
    await expect(tokens.verify((await other.issue(userId)).token)).resolves.toBeNull();
    await expect(tokens.verify('not-a-jwt')).resolves.toBeNull();
  });

  it('fails closed when the secret is missing or too short', async () => {
    const tokens = new HmacJwtTokenService('short', new FixedClock());
    await expect(tokens.issue(userId)).rejects.toThrow(/JWT_SECRET/);
  });
});
