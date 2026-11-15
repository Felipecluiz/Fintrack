import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { useAuth } from './AuthProvider';
import { AuthLayout } from './AuthLayout';

/** Espelha BR-402 para dar feedback antes de ir ao servidor. */
function passwordHint(password: string): string | null {
  if (password.length === 0) return null;
  if (password.length < 8) return 'Use pelo menos 8 caracteres.';
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Inclua letras e números.';
  return null;
}

export function RegisterPage() {
  const { user, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const registerMutation = useMutation({
    mutationFn: register,
  });

  // Um único redirecionamento, decidido pelo estado: quem acabou de se cadastrar
  // começa pelas categorias; quem já chegou logado vai para o dashboard.
  if (user) {
    return <Navigate to={registerMutation.isIdle ? '/app' : '/app/categories'} replace />;
  }

  const hint = passwordHint(password);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (hint) return;
    registerMutation.mutate({ name, email, password });
  };

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto. Seus dados ficam só com você."
      footer={
        <>
          Já tem conta? <Link to="/login">Entrar</Link>
        </>
      }
    >
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Nome</span>
          <input
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={hint !== null}
            aria-describedby="password-hint"
            maxLength={128}
            required
          />
          <small id="password-hint" className={hint ? 'field__error' : 'muted'}>
            {hint ?? 'Mínimo de 8 caracteres, com letras e números.'}
          </small>
        </label>
        <ErrorBanner error={registerMutation.error} />
        <button
          className="button button--primary button--block"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  );
}
