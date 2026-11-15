import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatCents } from '../../shared/lib/money';
import { StatTiles } from './StatTiles';

/**
 * O Intl usa espaço não separável (U+00A0) depois de "R$"; o Testing Library
 * normaliza o texto da página para espaço comum, então normalizamos o esperado.
 */
const money = (cents: number) => formatCents(cents).replace(/\s/g, ' ');

describe('StatTiles', () => {
  it('AC-308: shows income, expense and balance in BRL with the savings rate', () => {
    render(
      <StatTiles totals={{ incomeCents: 500_000, expenseCents: 120_000, balanceCents: 380_000 }} />,
    );

    expect(screen.getByText(money(500_000))).toBeInTheDocument();
    expect(screen.getByText(money(120_000))).toBeInTheDocument();
    expect(screen.getByText(money(380_000))).toBeInTheDocument();
    expect(screen.getByText('76% da receita guardada')).toBeInTheDocument();
  });

  it('omits the savings rate when there is no income', () => {
    render(<StatTiles totals={{ incomeCents: 0, expenseCents: 1_000, balanceCents: -1_000 }} />);
    expect(screen.queryByText(/da receita guardada/)).not.toBeInTheDocument();
  });
});
