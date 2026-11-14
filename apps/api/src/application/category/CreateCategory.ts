import type { CategoryDTO, CreateCategoryInput } from '@fintrack/contracts';
import { Category } from '../../domain/category/Category';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { ConflictError } from '../../domain/shared/errors';
import type { Clock } from '../ports/Clock';
import type { IdGenerator } from '../ports/IdGenerator';
import { toCategoryDTO } from './CategoryMapper';

export class CreateCategory {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateCategoryInput): Promise<CategoryDTO> {
    const category = Category.create({
      id: this.ids.next(),
      name: input.name,
      type: input.type,
      now: this.clock.now(),
    });

    await this.ensureNameIsAvailable(category);
    await this.categories.save(category);

    return toCategoryDTO(category);
  }

  /** BR-102 */
  private async ensureNameIsAvailable(category: Category): Promise<void> {
    const existing = await this.categories.findByName(category.name, category.type);
    if (existing) {
      throw new ConflictError(
        `A ${category.type} category named "${category.name}" already exists`,
      );
    }
  }
}
