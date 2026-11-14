import { z } from 'zod';
import { IsoDateSchema } from './common';

export const DashboardQuerySchema = z.object({
  from: IsoDateSchema.optional(),
  to: IsoDateSchema.optional(),
});
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export interface CategoryExpenseDTO {
  categoryId: string;
  categoryName: string;
  totalCents: number;
}

export interface MonthlyTotalDTO {
  /** YYYY-MM */
  month: string;
  incomeCents: number;
  expenseCents: number;
}

export interface DashboardSummaryDTO {
  period: { from: string; to: string };
  totals: {
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
  };
  expensesByCategory: CategoryExpenseDTO[];
  monthly: MonthlyTotalDTO[];
}
