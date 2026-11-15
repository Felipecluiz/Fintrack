import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../src/domain/shared/errors';
import { Email } from '../../src/domain/user/Email';
import { assertStrongPassword } from '../../src/domain/user/passwordPolicy';
import { createAuthTestContext, type AuthTestContext } from '../support/fakes';

const valid = { name: 'Ana Souza', email: 'Ana@Example.com', password: 'segredo123' };

describe('Email', () => {
  it('BR-401: normalizes to lowercase without surrounding spaces', () => {
    expect(Email.parse('  Ana@Example.COM ').toString()).toBe('ana@example.com');
  });

  it.each(['', 'ana', 'ana@', '@example.com', 'ana@example', 'a na@example.com'])(
    'AC-402: rejects "%s"',
    (raw) => {
      expect(() => Email.parse(raw)).toThrow(ValidationError);
    },
  );
});

describe('assertStrongPassword', () => {
  it.each(['curta1', 'somenteletras', '1234567890', 'x'.repeat(129) + '1'])(
    'AC-403: rejects "%s"',
    (password) => {
      expect(() => assertStrongPassword(password)).toThrow(ValidationError);
    },
  );

  it('accepts letters and numbers with 8+ characters', () => {
    expect(() => assertStrongPassword('senhaboa1')).not.toThrow();
  });
});

describe('Auth use cases', () => {
  let ctx: AuthTestContext;

  beforeEach(() => {
    ctx = createAuthTestContext();
  });

  it('AC-401: registers and returns a session without the password hash', async () => {
    const session = await ctx.auth.useCases.registerUser.execute(valid);

    expect(session.user).toEqual({
      id: expect.any(String),
      name: 'Ana Souza',
      email: 'ana@example.com',
      createdAt: '2026-11-13T12:00:00.000Z',
    });
    expect(session.token.split('.')).toHaveLength(3);
    expect(session.expiresAt).toBe('2026-11-20T12:00:00.000Z');
    expect(JSON.stringify(session)).not.toContain('hashed:');
  });

  it('AC-412: stores only the hash, never the password', async () => {
    await ctx.auth.useCases.registerUser.execute(valid);
    const [stored] = ctx.users.all();
    expect(stored?.passwordHash).toBe('hashed:segredo123');
  });

  it('AC-403: rejects a weak password', async () => {
    await expect(
      ctx.auth.useCases.registerUser.execute({ ...valid, password: 'somenteletras' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('AC-404: rejects an email that is already registered, ignoring case', async () => {
    await ctx.auth.useCases.registerUser.execute(valid);
    await expect(
      ctx.auth.useCases.registerUser.execute({ ...valid, email: 'ANA@example.com' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('AC-405: logs in with the right credentials', async () => {
    const registered = await ctx.auth.useCases.registerUser.execute(valid);
    const session = await ctx.auth.useCases.loginUser.execute({
      email: 'ana@example.com',
      password: 'segredo123',
    });
    expect(session.user.id).toBe(registered.user.id);
    expect(await ctx.auth.tokens.verify(session.token)).toBe(registered.user.id);
  });

  it('AC-406: wrong password and unknown email fail with the same message', async () => {
    await ctx.auth.useCases.registerUser.execute(valid);

    const wrongPassword = ctx.auth.useCases.loginUser
      .execute({ email: valid.email, password: 'errada123' })
      .catch((error: unknown) => error);
    const unknownEmail = ctx.auth.useCases.loginUser
      .execute({ email: 'ninguem@example.com', password: 'segredo123' })
      .catch((error: unknown) => error);

    const [a, b] = await Promise.all([wrongPassword, unknownEmail]);
    expect(a).toBeInstanceOf(UnauthorizedError);
    expect(b).toBeInstanceOf(UnauthorizedError);
    expect((a as Error).message).toBe((b as Error).message);
  });

  it('AC-408: returns the current user', async () => {
    const { user } = await ctx.auth.useCases.registerUser.execute(valid);
    await expect(ctx.auth.useCases.getCurrentUser.execute(user.id)).resolves.toEqual(user);
  });

  it('AC-407: an unknown user id is unauthorized', async () => {
    await expect(
      ctx.auth.useCases.getCurrentUser.execute('99999999-9999-4999-8999-999999999999'),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
