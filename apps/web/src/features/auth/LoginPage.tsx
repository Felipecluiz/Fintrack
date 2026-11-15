import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { useAuth } from './AuthProvider';
import { AuthLayout } from './AuthLayout';
import { useDemoLogin } from './useDemoLogin';

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useMutation({
    mutationFn: login,
  });
  const demoLogin = useDemoLogin();

  // Assim que a sessão existe, um único redirecionamento leva à rota de origem.
  if (user) {
    return <Navigate to={from} replace />;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Bom te ver de novo."
      footer={
        <>
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </>
      }
    >
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <ErrorBanner error={loginMutation.error ?? demoLogin.error} />
        <button className="button button--primary button--block" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="divider">ou</div>
      <button
        type="button"
        className="button button--ghost button--block"
        onClick={() => demoLogin.mutate()}
        disabled={demoLogin.isPending}
      >
        {demoLogin.isPending ? 'Abrindo a demo…' : 'Testar com conta demo'}
      </button>
    </AuthLayout>
  );
}
