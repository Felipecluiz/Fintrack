import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/queryKeys';
import { categoriesApi } from './api';

function invalidateCategoryData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => invalidateCategoryData(queryClient),
  });
}

export function useRenameCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => categoriesApi.rename(id, { name }),
    onSuccess: () => invalidateCategoryData(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => invalidateCategoryData(queryClient),
  });
}
