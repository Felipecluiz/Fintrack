import type { CategoryDTO, UpdateCategoryInput } from '@fintrack/contracts';
import type { Category } from '../../domain/category/Category';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { ConflictError, NotFoundError } from '../../domain/shared/errors';
import type { Clock } from '../ports/Clock';
import { toCategoryDTO } from './CategoryMapper';

export class RenameCategory {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, input: UpdateCategoryInput): Promise<CategoryDTO> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    category.rename(input.name, this.clock.now());
    await this.ensureNameIsAvailable(category);
    await this.categories.save(category);

    return toCategoryDTO(category);
  }

  /** BR-102: o próprio registro não conta como conflito. */
  private async ensureNameIsAvailable(category: Category): Promise<void> {
    const existing = await this.categories.findByName(category.name, category.type);
    if (existing && existing.id !== category.id) {
      throw new ConflictError(
        `A ${category.type} category named "${category.name}" already exists`,
      );
    }
  }
}
