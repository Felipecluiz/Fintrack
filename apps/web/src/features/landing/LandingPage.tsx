import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatCents } from '../../shared/lib/money';
import { Brand } from '../../shared/ui/Brand';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';
import { useAuth } from '../auth/AuthProvider';
import { useDemoLogin } from '../auth/useDemoLogin';
import { CategoryRanking } from '../dashboard/CategoryRanking';
import { MonthlyChart } from '../dashboard/MonthlyChart';
import { StatTiles } from '../dashboard/StatTiles';
import { buildDemoSummary } from './demoData';
import {
  DAYS_IN_HERO_MONTH,
  HERO_ENTRIES,
  HERO_MONTH,
  heroSavingsRate,
  heroTimeline,
  heroTopCategoryShare,
} from './heroData';
import { HowItWorks } from './HowItWorks';
import { LedgerBackdrop } from './LedgerBackdrop';
import { UnderTheHood } from './UnderTheHood';
import { useScrollProgress } from './useScrollProgress';

const FEATURES: Array<{ title: string; text: string; icon: ReactNode }> = [
  {
    title: 'Lançamentos em segundos',
    text: 'Valor, data e categoria. O app impede erros comuns, como lançar uma receita numa categoria de despesa.',
    icon: <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Zm3 5h4m-4 4h4" />,
  },
  {
    title: 'Um dashboard que responde',
    text: 'Receitas, despesas, saldo, a evolução mês a mês e para onde o dinheiro foi, em 3, 6 ou 12 meses.',
    icon: <path d="M4 20h16M7 16v-5m5 5V7m5 9v-3" />,
  },
  {
    title: 'Privado por padrão',
    text: 'Cada conta só enxerga os próprios dados. A senha é guardada com hash e a sessão é assinada.',
    icon: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 4v2" />,
  },
  {
    title: 'No bolso também',
    text: 'Funciona no navegador do celular, sem instalar nada. Rápido porque roda perto de você, na rede da Cloudflare.',
    icon: <path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2" />,
  },
];

const FAQ = [
  {
    question: 'É de graça?',
    answer: 'Sim. É um projeto de portfólio: sem plano pago, sem anúncios e sem cartão de crédito.',
  },
  {
    question: 'Preciso conectar minha conta do banco?',
    answer: 'Não. Você lança as transações; o Fintrack não lê nada do seu banco.',
  },
  {
    question: 'Quem consegue ver os meus dados?',
    answer:
      'Só você. Cada conta enxerga apenas os próprios registros, e a senha nunca é guardada em texto.',
  },
  {
    question: 'A conta demo é compartilhada?',
    answer:
      'Sim, qualquer visitante entra nela. Não guarde nada pessoal ali: os dados de exemplo podem ser recriados a qualquer momento.',
  },
];

const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

export function LandingPage() {
  const { user } = useAuth();
  const demoLogin = useDemoLogin();
  const demo = useMemo(() => buildDemoSummary(), []);
  // A rolagem do topo é o mês passando: linha do histórico, lançamentos e saldo.
  const [trackRef, scroll] = useScrollProgress<HTMLDivElement>();
  const timeline = heroTimeline(scroll.progress);
  const waitingForScroll = scroll.enabled && timeline.visibleEntries === 0;
  // A prévia "se monta" e o fechamento traça a linha subindo ao entrar na tela.
  const [previewRef, previewScroll] = useScrollProgress<HTMLElement>('pass');
  const [closingRef, closingScroll] = useScrollProgress<HTMLElement>('pass');

  const primaryCta = (
    <Link to={user ? '/app' : '/register'} className="button button--primary button--large">
      {user ? 'Abrir meu dashboard' : 'Criar conta grátis'}
    </Link>
  );
  const demoCta = !user && (
    <button
      type="button"
      className="button button--secondary button--large"
      onClick={() => demoLogin.mutate()}
      disabled={demoLogin.isPending}
    >
      {demoLogin.isPending ? 'Abrindo a demo…' : 'Testar com conta demo'}
    </button>
  );

  return (
    <div className="landing">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="landing__header">
        <Brand />
        <nav className="landing__anchors" aria-label="Seções">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#por-dentro">Por dentro</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <div className="landing__account">
          <ThemeToggle />
          {user ? (
            <Link to="/app" className="button button--primary button--small">
              Ir para o app
            </Link>
          ) : (
            <>
              <Link to="/login" className="button button--quiet button--small">
                Entrar
              </Link>
              <Link to="/register" className="button button--primary button--small">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <main id="conteudo">
        <div ref={trackRef} className="hero-track">
        <section className="hero">
          <LedgerBackdrop progress={timeline.history} />

          <div className="hero__copy">
            <p className="hero__kicker">Finanças pessoais, sem planilha</p>
            <h1>Saiba para onde vai cada real.</h1>
            <p className="hero__lead">
              Registre receitas e despesas em segundos, organize por categoria e acompanhe mês a
              mês num dashboard que responde na hora.
            </p>
            <div className="hero__actions">
              {primaryCta}
              {demoCta}
            </div>
            <p className="hero__fineprint">
              Grátis, sem cartão de crédito. Seus dados ficam só com você.
            </p>
            <ErrorBanner error={demoLogin.error} />
          </div>

          <figure className="statement" aria-label="Exemplo de extrato do mês">
            <div className="statement__sheet">
              <header className="statement__header">
                <span>Extrato de {currentMonthName}</span>
                <span className="statement__tag">Exemplo</span>
              </header>
              <div
                className="statement__month"
                role="progressbar"
                aria-label="Dias do mês"
                aria-valuemin={0}
                aria-valuemax={DAYS_IN_HERO_MONTH}
                aria-valuenow={Math.round(timeline.day)}
              >
                <span style={{ width: `${(timeline.day / DAYS_IN_HERO_MONTH) * 100}%` }} />
              </div>
              <p className="statement__balance">
                <span className="statement__balance-label">
                  {timeline.monthClosed ? 'Sobrou no mês' : 'Saldo até agora'}
                </span>
                <strong>{formatCents(timeline.balanceCents)}</strong>
              </p>
              <div className="statement__body">
                {waitingForScroll && (
                  <p className="statement__hint">Role a página para ver o mês acontecer.</p>
                )}
                <ul className="statement__entries">
                  {HERO_ENTRIES.map((entry, index) => (
                    <li key={entry.description} data-visible={index < timeline.visibleEntries}>
                      <span>
                        {entry.description}
                        <small>
                          Dia {entry.day} · {entry.category}
                        </small>
                      </span>
                      <span
                        className={entry.amountCents > 0 ? 'statement__in' : 'statement__out'}
                      >
                        {entry.amountCents > 0 ? '+' : '−'}{' '}
                        {formatCents(Math.abs(entry.amountCents))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p
              className="statement__chip statement__chip--savings"
              data-visible={timeline.monthClosed}
            >
              <span className="statement__chip-value">{heroSavingsRate}%</span>
              da receita guardada
            </p>
            <p
              className="statement__chip statement__chip--category"
              data-visible={timeline.monthClosed}
            >
              <span className="statement__chip-value">{heroTopCategoryShare}%</span>
              dos gastos foram com {HERO_MONTH.topCategory.name.toLowerCase()}
            </p>
          </figure>
        </section>
        </div>

        <section
          ref={previewRef}
          className="preview"
          aria-labelledby="preview-title"
          style={{ '--reveal': previewScroll.progress } as CSSProperties}
        >
          <div className="section-heading">
            <h2 id="preview-title">Assim fica o seu dashboard</h2>
            <span className="badge">Dados fictícios</span>
          </div>
          <StatTiles totals={demo.totals} />
          <div className="grid grid--dashboard">
            <MonthlyChart data={demo.monthly} />
            <CategoryRanking items={demo.expensesByCategory} />
          </div>
        </section>

        <section id="recursos" className="features" aria-labelledby="features-title">
          <h2 id="features-title">O essencial, bem feito</h2>
          <ul className="ledger-list">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="ledger-list__item">
                <svg
                  className="ledger-list__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  {feature.icon}
                </svg>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <HowItWorks />

        <UnderTheHood />

        <section id="duvidas" className="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Dúvidas</h2>
          <div className="faq__list">
            {FAQ.map((item) => (
              <details key={item.question} className="faq__item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          ref={closingRef}
          className="closing"
          aria-labelledby="closing-title"
          style={{ '--rise': closingScroll.progress } as CSSProperties}
        >
          <ClosingBackdrop />
          <h2 id="closing-title">Pronto para fechar o mês no azul?</h2>
          <p>Comece agora ou explore a conta demo, já com seis meses de lançamentos.</p>
          <div className="hero__actions">
            {primaryCta}
            {demoCta}
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <Brand />
        <p>Projeto de portfólio feito com Cloudflare Workers, D1, Pages e React.</p>
        <p>Pessoas, valores e lançamentos mostrados nesta página são fictícios.</p>
      </footer>
    </div>
  );
}

/** Linha subindo atrás do fechamento: o mês "fechando no azul". */
function ClosingBackdrop() {
  return (
    <svg
      className="closing__backdrop"
      viewBox="0 0 1000 320"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="closing__rules">
        {[40, 100, 160, 220, 280].map((y) => (
          <line key={y} x1="0" x2="1000" y1={y} y2={y} />
        ))}
      </g>
      <path
        className="closing__line"
        pathLength={1}
        d="M520 300 L600 288 L680 296 L760 252 L840 262 L900 196 L960 150 L1000 60"
      />
    </svg>
  );
}
