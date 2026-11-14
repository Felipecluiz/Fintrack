import type {
  CreateTransactionInput,
  Paginated,
  TransactionDTO,
  UpdateTransactionInput,
} from '@fintrack/contracts';
import { http, jsonBody, toQueryString } from '../../shared/api/httpClient';
import type { TransactionListParams } from '../../shared/api/queryKeys';

export const transactionsApi = {
  list: (params: TransactionListParams) =>
    http<Paginated<TransactionDTO>>(`/api/transactions${toQueryString({ ...params })}`),

  create: (input: CreateTransactionInput) =>
    http<TransactionDTO>('/api/transactions', { method: 'POST', ...jsonBody(input) }),

  update: (id: string, input: UpdateTransactionInput) =>
    http<TransactionDTO>(`/api/transactions/${id}`, { method: 'PATCH', ...jsonBody(input) }),

  remove: (id: string) => http<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
};
