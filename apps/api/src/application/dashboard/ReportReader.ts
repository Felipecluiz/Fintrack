import type { CalendarDate } from '../../domain/shared/CalendarDate';

export interface Period {
  from: CalendarDate;
  to: CalendarDate;
}

export interface TypeTotals {
  incomeCents: number;
  expenseCents: number;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  totalCents: number;
}

export interface MonthlyTotal {
  /** YYYY-MM */
  month: string;
  incomeCents: number;
  expenseCents: number;
}

/**
 * Porta de leitura do dashboard (CQRS leve — ver 003/plan.md).
 * As agregações rodam na fonte de dados, não em memória no Worker.
 */
export interface ReportReader {
  totals(period: Period): Promise<TypeTotals>;
  /** Só despesas, do maior para o menor valor (BR-305). */
  expensesByCategory(period: Period): Promise<CategoryTotal[]>;
  /** Apenas meses com movimento; o preenchimento com zeros é feito pelo caso de uso. */
  monthlyTotals(period: Period): Promise<MonthlyTotal[]>;
}
