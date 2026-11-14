import type { Category } from '../../domain/category/Category';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { BusinessRuleError } from '../../domain/shared/errors';

/**
 * BR-205. Uma categoria inexistente referenciada no corpo é violação de regra
 * (422), não "recurso não encontrado" (404) — ver 002/plan.md.
 */
export async function requireCategory(
  categories: CategoryRepository,
  categoryId: string,
): Promise<Category> {
  const category = await categories.findById(categoryId);
  if (!category) {
    throw new BusinessRuleError(`Category "${categoryId}" does not exist`);
  }
  return category;
}
