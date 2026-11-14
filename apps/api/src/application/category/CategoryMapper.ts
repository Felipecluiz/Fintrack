import type { CategoryDTO } from '@fintrack/contracts';
import type { Category } from '../../domain/category/Category';

export function toCategoryDTO(category: Category): CategoryDTO {
  const { id, name, type, createdAt, updatedAt } = category.toSnapshot();
  return {
    id,
    name,
    type,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}
