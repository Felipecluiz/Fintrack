import { Category } from '../../domain/category/Category';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import type { TransactionType } from '../../domain/shared/TransactionType';

interface CategoryRow {
  id: string;
  name: string;
  type: TransactionType;
  created_at: string;
  updated_at: string;
}

export class D1CategoryRepository implements CategoryRepository {
  constructor(private readonly db: D1Database) {}

  async findById(id: string): Promise<Category | null> {
    const row = await this.db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .bind(id)
      .first<CategoryRow>();
    return row ? toEntity(row) : null;
  }

  async findByName(name: string, type: TransactionType): Promise<Category | null> {
    const row = await this.db
      .prepare('SELECT * FROM categories WHERE name = ? COLLATE NOCASE AND type = ?')
      .bind(name, type)
      .first<CategoryRow>();
    return row ? toEntity(row) : null;
  }

  async list(): Promise<Category[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM categories ORDER BY type, name COLLATE NOCASE')
      .all<CategoryRow>();
    return results.map(toEntity);
  }

  async save(category: Category): Promise<void> {
    const c = category.toSnapshot();
    await this.db
      .prepare(
        `INSERT INTO categories (id, name, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           name = excluded.name,
           updated_at = excluded.updated_at`,
      )
      .bind(c.id, c.name, c.type, c.createdAt.toISOString(), c.updatedAt.toISOString())
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  }
}

function toEntity(row: CategoryRow): Category {
  return Category.restore({
    id: row.id,
    name: row.name,
    type: row.type,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}
