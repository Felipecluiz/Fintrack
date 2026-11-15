import type { DashboardSummaryDTO } from '@fintrack/contracts';
import { lastMonthsPeriod, toIsoDate } from '../../shared/lib/dates';

/** Mesmos números do seed da conta demo — a prévia e a demo contam a mesma história. */
const MONTHLY_INCOME = [770_000, 650_000, 800_000, 650_000, 830_000, 650_000];
const MONTHLY_EXPENSE = [332_000, 349_700, 367_400, 373_100, 354_800, 372_500];

const EXPENSES_BY_CATEGORY = [
  { categoryId: 'demo-moradia', categoryName: 'Moradia', totalCents: 1_080_000 },
  { categoryId: 'demo-mercado', categoryName: 'Mercado', totalCents: 688_500 },
  { categoryId: 'demo-transporte', categoryName: 'Transporte', totalCents: 228_000 },
  { categoryId: 'demo-lazer', categoryName: 'Lazer', totalCents: 153_000 },
];

/** Dados fictícios dos últimos 6 meses, relativos a `today` (AC-501). */
export function buildDemoSummary(today = new Date()): DashboardSummaryDTO {
  const monthly = MONTHLY_INCOME.map((incomeCents, index) => {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    return {
      month: toIsoDate(firstDay).slice(0, 7),
      incomeCents,
      expenseCents: MONTHLY_EXPENSE[index] ?? 0,
    };
  });

  const incomeCents = sum(MONTHLY_INCOME);
  const expenseCents = sum(MONTHLY_EXPENSE);

  return {
    period: lastMonthsPeriod(6, today),
    totals: { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents },
    expensesByCategory: EXPENSES_BY_CATEGORY,
    monthly,
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
