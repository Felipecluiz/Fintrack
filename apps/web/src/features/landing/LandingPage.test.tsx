import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { buildDemoSummary } from './demoData';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('AC-501: presents the product with clearly labelled fictitious data', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/cada real/);
    expect(screen.getByText('Dados fictícios')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /gráfico de barras mensal/i })).toBeInTheDocument();
  });

  it('AC-501 / AC-502: offers sign up, sign in and the demo account', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getAllByRole('link', { name: 'Criar conta grátis' })[0]).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('button', { name: 'Testar com conta demo' }).length).toBeGreaterThan(0);
  });
});

describe('buildDemoSummary', () => {
  it('covers the last 6 months ending in the current month, with consistent totals', () => {
    const summary = buildDemoSummary(new Date(2026, 10, 15)); // 15/11/2026

    expect(summary.monthly.map((m) => m.month)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(summary.period).toEqual({ from: '2026-06-01', to: '2026-11-30' });

    const monthlyExpenses = summary.monthly.reduce((sum, m) => sum + m.expenseCents, 0);
    const categoryExpenses = summary.expensesByCategory.reduce((sum, c) => sum + c.totalCents, 0);
    expect(monthlyExpenses).toBe(summary.totals.expenseCents);
    expect(categoryExpenses).toBe(summary.totals.expenseCents);
    expect(summary.totals.balanceCents).toBe(
      summary.totals.incomeCents - summary.totals.expenseCents,
    );
  });
});

describe('hero statement', () => {
  it('matches the last month of the demo data', async () => {
    const { HERO_MONTH, HERO_ENTRIES } = await import('./heroData');
    const lastMonth = buildDemoSummary(new Date(2026, 10, 15)).monthly.at(-1);

    expect(HERO_MONTH.incomeCents).toBe(lastMonth?.incomeCents);
    expect(HERO_MONTH.expenseCents).toBe(lastMonth?.expenseCents);
    expect(HERO_ENTRIES.every((entry) => entry.amountCents !== 0)).toBe(true);
    const net = HERO_ENTRIES.reduce((sum, entry) => sum + entry.amountCents, 0);
    expect(net).toBe(HERO_MONTH.incomeCents - HERO_MONTH.expenseCents);
  });
});

describe('heroTimeline (scroll = o mês passando)', () => {
  it('starts empty and ends with the whole month closed', async () => {
    const { heroTimeline, HERO_ENTRIES, heroBalanceCents } = await import('./heroData');

    expect(heroTimeline(0)).toMatchObject({ history: 0, visibleEntries: 0, balanceCents: 0 });
    expect(heroTimeline(1)).toMatchObject({
      history: 1,
      visibleEntries: HERO_ENTRIES.length,
      balanceCents: heroBalanceCents,
      monthClosed: true,
    });
  });

  it('adds entries in date order as the scroll advances', async () => {
    const { heroTimeline } = await import('./heroData');
    const counts = [0.1, 0.3, 0.5, 0.7, 0.9].map((p) => heroTimeline(p).visibleEntries);

    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(heroTimeline(0.35).balanceCents).toBe(650_000); // só o salário entrou
  });
});
