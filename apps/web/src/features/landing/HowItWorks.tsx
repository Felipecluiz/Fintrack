import { formatCents } from '../../shared/lib/money';
import {
  EXAMPLE_CATEGORIES,
  EXAMPLE_ENTRIES,
  EXAMPLE_SIGNUP,
  STEPS,
  howItWorksScene,
} from './howItWorksScene';
import { useScrollProgress } from './useScrollProgress';

/**
 * "Como funciona" com a tela grudada: a rolagem avança os passos e a cena ao
 * lado mostra o passo acontecendo (cadastro sendo preenchido, categorias
 * entrando, lançamentos atualizando o saldo).
 */
export function HowItWorks() {
  const [trackRef, scroll] = useScrollProgress<HTMLDivElement>('sticky');
  const scene = howItWorksScene(scroll.progress);

  return (
    <div ref={trackRef} id="como-funciona" className="how-track">
      <section className="how" aria-labelledby="steps-title">
        <div className="how__copy">
          <h2 id="steps-title">Como funciona</h2>
          <ol className="steps__list">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="step"
                data-active={scroll.enabled ? index === scene.step : undefined}
              >
                <span className="step__number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* A cena repete o que os passos já dizem em texto. */}
        <div className="how__stage" aria-hidden="true" data-step={scene.step}>
          <div className="how__scene how__scene--signup">
            <p className="how__scene-title">Criar conta</p>
            <TypedField label="Nome" value={EXAMPLE_SIGNUP.name} typed={scene.typed.name} />
            <TypedField label="E-mail" value={EXAMPLE_SIGNUP.email} typed={scene.typed.email} />
            <TypedField
              label="Senha"
              value={EXAMPLE_SIGNUP.password}
              typed={scene.typed.password}
            />
            <span
              className="how__submit"
              data-ready={scene.typed.password === EXAMPLE_SIGNUP.password.length}
            >
              Criar conta
            </span>
          </div>

          <div className="how__scene how__scene--categories">
            <p className="how__scene-title">Suas categorias</p>
            <ul className="how__chips">
              {EXAMPLE_CATEGORIES.map((category, index) => (
                <li
                  key={category.name}
                  className={`how__chip how__chip--${category.type}`}
                  data-visible={index < scene.visibleCategories}
                >
                  {category.name}
                  <small>{category.type === 'income' ? 'Receita' : 'Despesa'}</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="how__scene how__scene--entries">
            <p className="how__scene-title">Saldo do mês</p>
            <strong className="how__balance">{formatCents(scene.balanceCents)}</strong>
            <ul className="how__entries">
              {EXAMPLE_ENTRIES.map((entry, index) => (
                <li key={entry.description} data-visible={index < scene.visibleEntries}>
                  <span>
                    {entry.description}
                    <small>{entry.category}</small>
                  </span>
                  <span className={entry.amountCents > 0 ? 'statement__in' : 'statement__out'}>
                    {entry.amountCents > 0 ? '+' : '−'} {formatCents(Math.abs(entry.amountCents))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function TypedField({ label, value, typed }: { label: string; value: string; typed: number }) {
  const typing = typed > 0 && typed < value.length;
  return (
    <span className="how__field" data-filled={typed > 0}>
      <small>{label}</small>
      <span className="how__input">
        {value.slice(0, typed)}
        {typing && <span className="how__caret" />}
      </span>
    </span>
  );
}
