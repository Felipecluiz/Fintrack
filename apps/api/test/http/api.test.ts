import type { ApiErrorBody, CategoryDTO, TransactionDTO } from '@fintrack/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Env } from '../../src/main/env';
import { createApp } from '../../src/presentation/http/createApp';
import { createTestContext } from '../support/fakes';

const env: Env = { DB: {} as D1Database, ALLOWED_ORIGINS: 'http://localhost:5173' };
const MISSING_ID = '99999999-9999-4999-8999-999999999999';

function setup() {
  const ctx = createTestContext();
  const app = createApp(() => ctx.useCases);

  const request = (method: string, path: string, body?: unknown) =>
    app.request(
      path,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      env,
    );

  return { request };
}

describe('HTTP API', () => {
  let request: ReturnType<typeof setup>['request'];

  beforeEach(() => {
    ({ request } = setup());
  });

  it('responds to the health check', async () => {
    const res = await request('GET', '/api/health');
    expect(res.status).toBe(200);
  });

  it('AC-101: POST /api/categories returns 201', async () => {
    const res = await request('POST', '/api/categories', { name: 'Mercado', type: 'expense' });

    expect(res.status).toBe(201);
    expect(await res.json<CategoryDTO>()).toMatchObject({ name: 'Mercado', type: 'expense' });
  });

  it('AC-102: blank name returns 400 VALIDATION_ERROR', async () => {
    const res = await request('POST', '/api/categories', { name: '   ', type: 'expense' });

    expect(res.status).toBe(400);
    expect((await res.json<ApiErrorBody>()).error.code).toBe('VALIDATION_ERROR');
  });

  it('AC-104: duplicate name returns 409 CONFLICT', async () => {
    await request('POST', '/api/categories', { name: 'Mercado', type: 'expense' });
    const res = await request('POST', '/api/categories', { name: 'MERCADO', type: 'expense' });

    expect(res.status).toBe(409);
    expect((await res.json<ApiErrorBody>()).error.code).toBe('CONFLICT');
  });

  it('AC-108: unknown id returns 404 NOT_FOUND', async () => {
    const res = await request('DELETE', `/api/categories/${MISSING_ID}`);
    expect(res.status).toBe(404);
  });

  it('AC-110: deleting a category in use returns 422', async () => {
    const category = await (
      await request('POST', '/api/categories', { name: 'Mercado', type: 'expense' })
    ).json<CategoryDTO>();
    await request('POST', '/api/transactions', {
      description: 'Compras',
      amountCents: 1000,
      type: 'expense',
      categoryId: category.id,
      occurredOn: '2026-11-01',
    });

    const res = await request('DELETE', `/api/categories/${category.id}`);
    expect(res.status).toBe(422);
    expect((await res.json<ApiErrorBody>()).error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('AC-201 / AC-204: creates transactions and enforces the category type', async () => {
    const category = await (
      await request('POST', '/api/categories', { name: 'Mercado', type: 'expense' })
    ).json<CategoryDTO>();
    const valid = {
      description: 'Compras',
      amountCents: 1000,
      type: 'expense',
      categoryId: category.id,
      occurredOn: '2026-11-01',
    };

    const created = await request('POST', '/api/transactions', valid);
    expect(created.status).toBe(201);
    expect(await created.json<TransactionDTO>()).toMatchObject({ amountCents: 1000 });

    const mismatched = await request('POST', '/api/transactions', { ...valid, type: 'income' });
    expect(mismatched.status).toBe(422);
  });

  it('AC-202: amount zero returns 400', async () => {
    const res = await request('POST', '/api/transactions', {
      description: 'x',
      amountCents: 0,
      type: 'expense',
      categoryId: MISSING_ID,
      occurredOn: '2026-11-01',
    });
    expect(res.status).toBe(400);
  });

  it('AC-211: PATCH with an empty body returns 400', async () => {
    const res = await request('PATCH', `/api/transactions/${MISSING_ID}`, {});
    expect(res.status).toBe(400);
  });

  it('AC-305: dashboard with from > to returns 400', async () => {
    const res = await request('GET', '/api/dashboard/summary?from=2026-02-01&to=2026-01-01');
    expect(res.status).toBe(400);
  });

  it('returns 404 in the standard error format for unknown routes', async () => {
    const res = await request('GET', '/api/nope');
    expect(res.status).toBe(404);
    expect((await res.json<ApiErrorBody>()).error.code).toBe('NOT_FOUND');
  });
});
