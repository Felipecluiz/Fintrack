import type { TransactionType } from '../shared/TransactionType';
import type { Category } from './Category';

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  /** Busca sem diferenciar maiúsculas de minúsculas (BR-102). */
  findByName(name: string, type: TransactionType): Promise<Category | null>;
  /** Ordenadas por tipo e depois por nome (AC-106). */
  list(): Promise<Category[]>;
  save(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
}
