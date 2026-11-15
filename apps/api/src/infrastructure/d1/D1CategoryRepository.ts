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

/**
 * Repositório escopado por dono (BR-405): toda leitura e escrita inclui
 * `user_id = ownerId`. Um caso de uso que recebe esta instância não tem como
 * enxergar categorias de outro usuário.
 */
export class D1CategoryRepository implements CategoryRepository {
  constructor(
    private readonly db: D1Database,
    private readonly ownerId: string,
  ) {}

  async findById(id: string): Promise<Category | null> {
    const row = await this.db
      .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
      .bind(id, this.ownerId)
      .first<CategoryRow>();
    return row ? toEntity(row) : null;
  }

  async findByName(name: string, type: TransactionType): Promise<Category | null> {
    const row = await this.db
      .prepare(
        'SELECT * FROM categories WHERE user_id = ? AND name = ? COLLATE NOCASE AND type = ?',
      )
      .bind(this.ownerId, name, type)
      .first<CategoryRow>();
    return row ? toEntity(row) : null;
  }

  async list(): Promise<Category[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type, name COLLATE NOCASE')
      .bind(this.ownerId)
      .all<CategoryRow>();
    return results.map(toEntity);
  }

  async save(category: Category): Promise<void> {
    const c = category.toSnapshot();
    await this.db
      .prepare(
        `INSERT INTO categories (id, user_id, name, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           name = excluded.name,
           updated_at = excluded.updated_at
         WHERE categories.user_id = excluded.user_id`,
      )
      .bind(
        c.id,
        this.ownerId,
        c.name,
        c.type,
        c.createdAt.toISOString(),
        c.updatedAt.toISOString(),
      )
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
      .bind(id, this.ownerId)
      .run();
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
