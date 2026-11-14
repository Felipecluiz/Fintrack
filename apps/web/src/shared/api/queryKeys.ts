import type { ListTransactionsQuery } from '@fintrack/contracts';

export type TransactionListParams = Partial<ListTransactionsQuery>;

/** Chaves do React Query em um só lugar, para invalidar de forma consistente. */
export const queryKeys = {
  categories: ['categories'] as const,
  transactions: ['transactions'] as const,
  transactionList: (params: TransactionListParams) => ['transactions', 'list', params] as const,
  dashboard: ['dashboard'] as const,
  dashboardSummary: (from: string, to: string) => ['dashboard', 'summary', from, to] as const,
};
