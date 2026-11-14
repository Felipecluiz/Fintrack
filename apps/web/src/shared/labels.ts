import type { TransactionType } from '@fintrack/contracts';

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
};
