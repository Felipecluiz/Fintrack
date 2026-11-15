import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../../shared/ui/Brand';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';
import { useAuth } from '../auth/AuthProvider';
import { useDemoLogin } from '../auth/useDemoLogin';
import { CategoryRanking } from '../dashboard/CategoryRanking';
import { MonthlyChart } from '../dashboard/MonthlyChart';
import { StatTiles } from '../dashboard/StatTiles';
import { buildDemoSummary } from './demoData';

const FEATURES = [
  {
    title: 'Lançamentos em segundos',
    text: 'Valor, data e categoria. O app impede erros comuns, como lançar uma receita numa categoria de despesa.',
  },
  {
    title: 'Dashboard que responde',
    text: 'Receitas, despesas, saldo, evolução mês a mês e o ranking de onde o dinheiro foi, em 3, 6 ou 12 meses.',
  },
  {
    title: 'Privado por padrão',
    text: 'Cada conta só enxerga os próprios dados. Senha guardada com hash PBKDF2 e sessão assinada.',
  },
  {
    title: 'Rápido em qualquer lugar',
    text: 'Roda na borda da Cloudflare, perto de você, e funciona bem no celular.',
  },
];

const STEPS = [
  { title: 'Crie sua conta', text: 'Nome, e-mail e senha. Sem cartão de crédito.' },
  { title: 'Monte suas categorias', text: 'Salário, Moradia, Mercado… do jeito que você pensa.' },
  { title: 'Lance e acompanhe', text: 'Cada lançamento atualiza o dashboard na hora.' },
];

export function LandingPage() {
  const { user } = useAuth();
  const demoLogin = useDemoLogin();
  const demo = useMemo(() => buildDemoSummary(), []);

  const tryDemo = (
    <button
      type="button"
      className="button button--ghost button--large"
      onClick={() => demoLogin.mutate()}
      disabled={demoLogin.isPending}
    >
      {demoLogin.isPending ? 'Abrindo a demo…' : 'Testar com conta demo'}
    </button>
  );

  return (
    <div className="landing">
      <header className="landing__header">
        <Brand />
        <nav className="landing__nav" aria-label="Conta">
          <ThemeToggle />
          {user ? (
            <Link to="/app" className="button button--primary button--small">
              Ir para o app
            </Link>
          ) : (
            <>
              <Link to="/login" className="button button--ghost button--small">
                Entrar
              </Link>
              <Link to="/register" className="button button--primary button--small">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Finanças pessoais, sem planilha</p>
          <h1>Saiba para onde vai cada real — num olhar.</h1>
          <p className="hero__lead">
            Registre receitas e despesas em segundos, organize por categoria e acompanhe mês a mês
            num dashboard que responde na hora.
          </p>
          <div className="hero__actions">
            <Link to={user ? '/app' : '/register'} className="button button--primary button--large">
              {user ? 'Abrir meu dashboard' : 'Criar conta grátis'}
            </Link>
            {!user && tryDemo}
          </div>
          <ErrorBanner error={demoLogin.error} />
        </section>

        <section className="preview" aria-labelledby="preview-title">
          <div className="preview__header">
            <h2 id="preview-title">Assim fica o seu dashboard</h2>
            <span className="badge">Dados fictícios</span>
          </div>
          <StatTiles totals={demo.totals} />
          <div className="grid grid--dashboard">
            <MonthlyChart data={demo.monthly} />
            <CategoryRanking items={demo.expensesByCategory} />
          </div>
        </section>

        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title">O essencial, bem feito</h2>
          <div className="grid grid--features">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card feature">
                <h3>{feature.title}</h3>
                <p className="muted">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="steps" aria-labelledby="steps-title">
          <h2 id="steps-title">Como funciona</h2>
          <ol className="steps__list">
            {STEPS.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step__number" aria-hidden>
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="cta card">
          <h2>Pronto para enxergar suas finanças?</h2>
          <p className="muted">Comece agora ou explore a conta demo, já com seis meses de dados.</p>
          <div className="hero__actions">
            <Link to={user ? '/app' : '/register'} className="button button--primary button--large">
              {user ? 'Abrir meu dashboard' : 'Criar conta grátis'}
            </Link>
            {!user && tryDemo}
          </div>
        </section>
      </main>

      <footer className="landing__footer muted">
        Fintrack · projeto de portfólio feito com Cloudflare Workers, D1, Pages e React.
      </footer>
    </div>
  );
}
