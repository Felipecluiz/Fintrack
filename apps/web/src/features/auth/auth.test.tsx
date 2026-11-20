import type { AuthResponseDTO } from '@fintrack/contracts';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
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
    await userEvent.type(screen.getByLabelText(/^Senha/), 'segredo123');
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
    await userEvent.type(screen.getByLabelText(/^Senha/), 'errada123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha incorretos'),
    );
  });
});

describe('Sign-up with Turnstile (BR-408)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  function renderRegister() {
    return renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app/*" element={<p>Área logada</p>} />
      </Routes>,
      { route: '/register' },
    );
  }

  it('AC-414: waits for the human check and sends its token with the sign-up', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
    let pass: (token: string) => void = () => {};
    const renderWidget = vi.fn(
      (_container: HTMLElement, options: { action: string; callback: (token: string) => void }) => {
        pass = options.callback;
        return 'widget-1';
      },
    );
    window.turnstile = { render: renderWidget, reset: vi.fn(), remove: vi.fn() };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(201, session));
    renderRegister();

    await userEvent.type(screen.getByLabelText('Nome'), 'Ana');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText(/^Senha/), 'segredo123');
    const submit = screen.getByRole('button', { name: 'Criar conta' });
    expect(submit).toBeDisabled();

    await waitFor(() => expect(renderWidget).toHaveBeenCalled());
    expect(renderWidget.mock.calls[0]![1].action).toBe('register');
    act(() => pass('tok-123'));
    await userEvent.click(submit);

    expect(await screen.findByText('Área logada')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Turnstile-Token': 'tok-123' }),
      }),
    );
  });

  it('signs up without the widget when no site key is configured', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(201, session));
    renderRegister();

    await userEvent.type(screen.getByLabelText('Nome'), 'Ana');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText(/^Senha/), 'segredo123');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Área logada')).toBeInTheDocument();
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.headers).not.toHaveProperty('X-Turnstile-Token');
  });
});
