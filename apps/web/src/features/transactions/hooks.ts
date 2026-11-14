import type { CreateTransactionInput } from '@fintrack/contracts';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { queryKeys, type TransactionListParams } from '../../shared/api/queryKeys';
import { transactionsApi } from './api';

function invalidateTransactionData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function useTransactions(params: TransactionListParams) {
  return useQuery({
    queryKey: queryKeys.transactionList(params),
    queryFn: () => transactionsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Cria ou atualiza, conforme exista um id. */
export function useSaveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CreateTransactionInput }) =>
      id ? transactionsApi.update(id, input) : transactionsApi.create(input),
    onSuccess: () => invalidateTransactionData(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.remove,
    onSuccess: () => invalidateTransactionData(queryClient),
  });
}
