import type {
  ApiErrorBody,
  AuthResponseDTO,
  CategoryDTO,
  DashboardSummaryDTO,
  Paginated,
  TransactionDTO,
} from '@fintrack/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Env, RateLimiter } from '../../src/main/env';
import { FakeHumanVerifier } from '../support/fakes';
import { createTestApp } from '../support/testApp';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';

function setup(envOverrides: Partial<Env> = {}) {
  const { app } = createTestApp();
  const env: Env = {
    DB: {} as D1Database,
    ALLOWED_ORIGINS: 'http://localhost:5173',
    ...envOverrides,
  };

  const request = (method: string, path: string, body?: unknown, token?: string) =>
    app.request(
      path,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      env,
    );

  /** Cadastra um usuário e devolve um `request` já autenticado como ele. */
  const signUp = async (email: string) => {
    const res = await request('POST', '/api/auth/register', {
      name: email,
      email,
      password: 'segredo123',
    });
    const { token } = await res.json<AuthResponseDTO>();
    return (method: string, path: string, body?: unknown) => request(method, path, body, token);
  };

  return { request, signUp };
}

describe('HTTP API — public routes', () => {
  it('responds to the health check without auth', async () => {
    const { request } = setup();
    expect((await request('GET', '/api/health')).status).toBe(200);
  });

  it('AC-401: POST /api/auth/register returns 201 with a session', async () => {
    const { request } = setup();
    const res = await request('POST', '/api/auth/register', {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'segredo123',
    });

    expect(res.status).toBe(201);
    const body = await res.json<AuthResponseDTO>();
    expect(body.user.email).toBe('ana@example.com');
    expect(body.token).toBeTruthy();
  });

  it('AC-402 / AC-403: invalid email or weak password returns 400', async () => {
    const { request } = setup();
    const invalidEmail = await request('POST', '/api/auth/register', {
      name: 'Ana',
      email: 'ana',
      password: 'segredo123',
    });
    const weakPassword = await request('POST', '/api/auth/register', {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'somenteletras',
    });

    expect(invalidEmail.status).toBe(400);
    expect(weakPassword.status).toBe(400);
  });

  it('AC-404 / AC-405 / AC-406: duplicate email, login and wrong password', async () => {
    const { request, signUp } = setup();
    await signUp('ana@example.com');

    const duplicate = await request('POST', '/api/auth/register', {
      name: 'Outra Ana',
      email: 'ANA@example.com',
      password: 'segredo123',
    });
    const login = await request('POST', '/api/auth/login', {
      email: 'ana@example.com',
      password: 'segredo123',
    });
    const wrong = await request('POST', '/api/auth/login', {
      email: 'ana@example.com',
      password: 'errada123',
    });

    expect(duplicate.status).toBe(409);
    expect(login.status).toBe(200);
    expect(wrong.status).toBe(401);
    expect((await wrong.json<ApiErrorBody>()).error.code).toBe('UNAUTHORIZED');
  });

  it('AC-411: returns 429 when the rate limiter refuses', async () => {
    let calls = 0;
    const limiter: RateLimiter = {
      limit: async () => ({ success: (calls += 1) <= 2 }),
    };
    const { request } = setup({ AUTH_RATE_LIMITER: limiter });
    const attempt = () =>
      request('POST', '/api/auth/login', { email: 'x@example.com', password: 'segredo123' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect((await blocked.json<ApiErrorBody>()).error.code).toBe('RATE_LIMITED');
  });
});

describe('HTTP API — human verification (Turnstile)', () => {
  const env: Env = { DB: {} as D1Database, ALLOWED_ORIGINS: 'http://localhost:5173' };
  const newUser = { name: 'Ana', email: 'ana@example.com', password: 'segredo123' };

  function register(app: ReturnType<typeof createTestApp>['app'], token?: string) {
    return app.request(
      '/api/auth/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '203.0.113.7',
          ...(token ? { 'X-Turnstile-Token': token } : {}),
        },
        body: JSON.stringify(newUser),
      },
      env,
    );
  }

  it('AC-413: rejects sign-up without a valid human token and creates no account', async () => {
    const humans = new FakeHumanVerifier();
    const { app } = createTestApp({ humans });

    const missing = await register(app);
    const invalid = await register(app, 'robot');

    for (const res of [missing, invalid]) {
      expect(res.status).toBe(403);
      expect((await res.json<ApiErrorBody>()).error.code).toBe('HUMAN_VERIFICATION_FAILED');
    }
    const login = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email, password: newUser.password }),
      },
      env,
    );
    expect(login.status).toBe(401); // a conta não foi criada
  });

  it('AC-414: accepts sign-up with a valid token, checking action and IP', async () => {
    const humans = new FakeHumanVerifier();
    const { app } = createTestApp({ humans });

    const res = await register(app, 'human-ok');

    expect(res.status).toBe(201);
    expect(humans.checks).toEqual([
      { token: 'human-ok', action: 'register', remoteIp: '203.0.113.7' },
    ]);
  });

  it('AC-414: login does not require the human token', async () => {
    const { app } = createTestApp({ humans: new FakeHumanVerifier() });
    await register(app, 'human-ok');

    const login = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email, password: newUser.password }),
      },
      env,
    );
    expect(login.status).toBe(200);
  });

  it('allows the token header in CORS preflight', async () => {
    const { app } = createTestApp();
    const res = await app.request(
      '/api/auth/register',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,x-turnstile-token',
        },
      },
      env,
    );
    expect(res.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain(
      'x-turnstile-token',
    );
  });
});

describe('HTTP API — authentication', () => {
  it('AC-407: protected routes require a valid bearer token', async () => {
    const { request } = setup();

    const noToken = await request('GET', '/api/categories');
    const badToken = await request('GET', '/api/categories', undefined, 'abc.def.ghi');

    expect(noToken.status).toBe(401);
    expect(badToken.status).toBe(401);
    expect((await noToken.json<ApiErrorBody>()).error.code).toBe('UNAUTHORIZED');
  });

  it('AC-408: GET /api/me returns the token owner', async () => {
    const { signUp } = setup();
    const asAna = await signUp('ana@example.com');

    const res = await asAna('GET', '/api/me');
    expect(res.status).toBe(200);
    expect((await res.json<{ email: string }>()).email).toBe('ana@example.com');
  });
});

describe('HTTP API — business routes', () => {
  let asAna: Awaited<ReturnType<ReturnType<typeof setup>['signUp']>>;

  beforeEach(async () => {
    asAna = await setup().signUp('ana@example.com');
  });

  it('AC-101: POST /api/categories returns 201', async () => {
    const res = await asAna('POST', '/api/categories', { name: 'Mercado', type: 'expense' });

    expect(res.status).toBe(201);
    expect(await res.json<CategoryDTO>()).toMatchObject({ name: 'Mercado', type: 'expense' });
  });

  it('AC-102: blank name returns 400 VALIDATION_ERROR', async () => {
    const res = await asAna('POST', '/api/categories', { name: '   ', type: 'expense' });

    expect(res.status).toBe(400);
    expect((await res.json<ApiErrorBody>()).error.code).toBe('VALIDATION_ERROR');
  });

  it('AC-104: duplicate name returns 409 CONFLICT', async () => {
    await asAna('POST', '/api/categories', { name: 'Mercado', type: 'expense' });
    const res = await asAna('POST', '/api/categories', { name: 'MERCADO', type: 'expense' });

    expect(res.status).toBe(409);
  });

  it('AC-108: unknown id returns 404 NOT_FOUND', async () => {
    const res = await asAna('DELETE', `/api/categories/${MISSING_ID}`);
    expect(res.status).toBe(404);
  });

  it('AC-110: deleting a category in use returns 422', async () => {
    const category = await (
      await asAna('POST', '/api/categories', { name: 'Mercado', type: 'expense' })
    ).json<CategoryDTO>();
    await asAna('POST', '/api/transactions', {
      description: 'Compras',
      amountCents: 1000,
      type: 'expense',
      categoryId: category.id,
      occurredOn: '2026-11-01',
    });

    const res = await asAna('DELETE', `/api/categories/${category.id}`);
    expect(res.status).toBe(422);
  });

  it('AC-201 / AC-204: creates transactions and enforces the category type', async () => {
    const category = await (
      await asAna('POST', '/api/categories', { name: 'Mercado', type: 'expense' })
    ).json<CategoryDTO>();
    const valid = {
      description: 'Compras',
      amountCents: 1000,
      type: 'expense',
      categoryId: category.id,
      occurredOn: '2026-11-01',
    };

    const created = await asAna('POST', '/api/transactions', valid);
    expect(created.status).toBe(201);
    expect(await created.json<TransactionDTO>()).toMatchObject({ amountCents: 1000 });

    const mismatched = await asAna('POST', '/api/transactions', { ...valid, type: 'income' });
    expect(mismatched.status).toBe(422);
  });

  it('AC-202: amount zero returns 400', async () => {
    const res = await asAna('POST', '/api/transactions', {
      description: 'x',
      amountCents: 0,
      type: 'expense',
      categoryId: MISSING_ID,
      occurredOn: '2026-11-01',
    });
    expect(res.status).toBe(400);
  });

  it('AC-211: PATCH with an empty body returns 400', async () => {
    const res = await asAna('PATCH', `/api/transactions/${MISSING_ID}`, {});
    expect(res.status).toBe(400);
  });

  it('AC-305: dashboard with from > to returns 400', async () => {
    const res = await asAna('GET', '/api/dashboard/summary?from=2026-02-01&to=2026-01-01');
    expect(res.status).toBe(400);
  });

  it('returns 404 in the standard error format for unknown routes', async () => {
    const res = await asAna('GET', '/api/nope');
    expect(res.status).toBe(404);
    expect((await res.json<ApiErrorBody>()).error.code).toBe('NOT_FOUND');
  });
});

describe('HTTP API — data isolation between users', () => {
  it('AC-409 / AC-410: users never see or touch each other data', async () => {
    const { signUp } = setup();
    const asAna = await signUp('ana@example.com');
    const asBia = await signUp('bia@example.com');

    const anaCategory = await (
      await asAna('POST', '/api/categories', { name: 'Mercado', type: 'expense' })
    ).json<CategoryDTO>();
    const anaTransaction = await (
      await asAna('POST', '/api/transactions', {
        description: 'Compras',
        amountCents: 50_000,
        type: 'expense',
        categoryId: anaCategory.id,
        occurredOn: '2026-11-01',
      })
    ).json<TransactionDTO>();

    // Bia não lista nada da Ana…
    expect(await (await asBia('GET', '/api/categories')).json<CategoryDTO[]>()).toEqual([]);
    const biaTransactions = await (
      await asBia('GET', '/api/transactions')
    ).json<Paginated<TransactionDTO>>();
    expect(biaTransactions.total).toBe(0);

    // …não lê, não altera e não exclui (para ela, não existe)…
    expect((await asBia('GET', `/api/transactions/${anaTransaction.id}`)).status).toBe(404);
    expect(
      (await asBia('PATCH', `/api/categories/${anaCategory.id}`, { name: 'Hack' })).status,
    ).toBe(404);
    expect((await asBia('DELETE', `/api/transactions/${anaTransaction.id}`)).status).toBe(404);

    // …não usa a categoria da Ana (AC-410)…
    const crossCategory = await asBia('POST', '/api/transactions', {
      description: 'x',
      amountCents: 100,
      type: 'expense',
      categoryId: anaCategory.id,
      occurredOn: '2026-11-01',
    });
    expect(crossCategory.status).toBe(422);

    // …e o dashboard dela não soma os dados da Ana.
    const biaDashboard = await (
      await asBia('GET', '/api/dashboard/summary?from=2026-11-01&to=2026-11-30')
    ).json<DashboardSummaryDTO>();
    expect(biaDashboard.totals.expenseCents).toBe(0);

    // Os dados da Ana continuam intactos.
    const anaDashboard = await (
      await asAna('GET', '/api/dashboard/summary?from=2026-11-01&to=2026-11-30')
    ).json<DashboardSummaryDTO>();
    expect(anaDashboard.totals.expenseCents).toBe(50_000);
  });
});
