import type { CategoryDTO, CreateCategoryInput, UpdateCategoryInput } from '@fintrack/contracts';
import { http, jsonBody } from '../../shared/api/httpClient';

export const categoriesApi = {
  list: () => http<CategoryDTO[]>('/api/categories'),

  create: (input: CreateCategoryInput) =>
    http<CategoryDTO>('/api/categories', { method: 'POST', ...jsonBody(input) }),

  rename: (id: string, input: UpdateCategoryInput) =>
    http<CategoryDTO>(`/api/categories/${id}`, { method: 'PATCH', ...jsonBody(input) }),

  remove: (id: string) => http<void>(`/api/categories/${id}`, { method: 'DELETE' }),
};
