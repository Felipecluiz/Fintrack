import type { AuthResponseDTO } from '@fintrack/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { LoginPage } from './LoginPage';
import { RequireAuth } from './RequireAuth';
import { loadSession, saveSession } from './session';

const session: AuthResponseDTO = {
  token: 'header.payload.signature',
  expiresAt: '2999-01-01T00:00:00.000Z',
  user: { id: 'u1', name: 'Ana', email: 'ana@example.com', createdAt: '2026-01-01T00:00:00.000Z' },
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderApp(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <p>Área logada</p>
          </RequireAuth>
        }
      />
    </Routes>,
    { route },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('session storage', () => {
  it('discards an expired session', () => {
    saveSession({ ...session, expiresAt: '2000-01-01T00:00:00.000Z' });
    expect(loadSession()).toBeNull();
  });
});

describe('Auth flow', () => {
  it('AC-503: redirects to /login without a session', () => {
    renderApp('/app/transactions');
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('AC-503: signs in and returns to the protected route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, session));
    renderApp('/app/transactions');

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Área logada')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(loadSession()?.user.email).toBe('ana@example.com');
  });

  it('AC-406: shows a friendly error on wrong credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }),
    );
    renderApp('/login');

    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha incorretos'),
    );
  });
});
