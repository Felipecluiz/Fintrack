import type { CategoryDTO } from '@fintrack/contracts';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { toCategoryDTO } from './CategoryMapper';

export class ListCategories {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(): Promise<CategoryDTO[]> {
    const categories = await this.categories.list();
    return categories.map(toCategoryDTO);
  }
}
