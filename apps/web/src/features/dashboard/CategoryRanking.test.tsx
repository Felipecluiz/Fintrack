import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryRanking } from './CategoryRanking';

const item = (name: string, totalCents: number) => ({
  categoryId: name,
  categoryName: name,
  totalCents,
});

describe('CategoryRanking', () => {
  it('BR-305: lists categories with their share of the total', () => {
    render(<CategoryRanking items={[item('Moradia', 7_500), item('Mercado', 2_500)]} />);

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]!).getByText('Moradia')).toBeInTheDocument();
    expect(within(rows[0]!).getByText(/75%/)).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/25%/)).toBeInTheDocument();
  });

  it('folds everything after the 5th category into "Outras"', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name, i) => item(name, 1_000 - i));
    render(<CategoryRanking items={items} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Outras (2)')).toBeInTheDocument();
  });

  it('shows an empty state without expenses', () => {
    render(<CategoryRanking items={[]} />);
    expect(screen.getByText('Nenhuma despesa no período.')).toBeInTheDocument();
  });
});
