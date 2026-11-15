import { CalendarDate } from '../../domain/shared/CalendarDate';
import { Money } from '../../domain/shared/Money';
import type { PageRequest, PageResult } from '../../domain/shared/pagination';
import type { TransactionType } from '../../domain/shared/TransactionType';
import { Transaction } from '../../domain/transaction/Transaction';
import type {
  TransactionFilter,
  TransactionRepository,
} from '../../domain/transaction/TransactionRepository';

interface TransactionRow {
  id: string;
  description: string;
  amount_cents: number;
  type: TransactionType;
  category_id: string;
  occurred_on: string;
  created_at: string;
  updated_at: string;
}

interface WhereClause {
  sql: string;
  params: unknown[];
}

/** Escopado por dono (BR-405) — ver `D1CategoryRepository`. */
export class D1TransactionRepository implements TransactionRepository {
  constructor(
    private readonly db: D1Database,
    private readonly ownerId: string,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.db
      .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
      .bind(id, this.ownerId)
      .first<TransactionRow>();
    return row ? toEntity(row) : null;
  }

  async list(filter: TransactionFilter, page: PageRequest): Promise<PageResult<Transaction>> {
    const where = this.buildWhere(filter);
    const offset = (page.page - 1) * page.pageSize;

    const [rows, count] = await Promise.all([
      this.db
        .prepare(
          `SELECT * FROM transactions ${where.sql}
           ORDER BY occurred_on DESC, created_at DESC
           LIMIT ? OFFSET ?`,
        )
        .bind(...where.params, page.pageSize, offset)
        .all<TransactionRow>(),
      this.db
        .prepare(`SELECT COUNT(*) AS total FROM transactions ${where.sql}`)
        .bind(...where.params)
        .first<{ total: number }>(),
    ]);

    return { items: rows.results.map(toEntity), total: count?.total ?? 0 };
  }

  async save(transaction: Transaction): Promise<void> {
    const t = transaction.toSnapshot();
    await this.db
      .prepare(
        `INSERT INTO transactions
           (id, user_id, description, amount_cents, type, category_id, occurred_on, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           description  = excluded.description,
           amount_cents = excluded.amount_cents,
           type         = excluded.type,
           category_id  = excluded.category_id,
           occurred_on  = excluded.occurred_on,
           updated_at   = excluded.updated_at
         WHERE transactions.user_id = excluded.user_id`,
      )
      .bind(
        t.id,
        this.ownerId,
        t.description,
        t.amount.cents,
        t.type,
        t.categoryId,
        t.occurredOn.toString(),
        t.createdAt.toISOString(),
        t.updatedAt.toISOString(),
      )
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      .bind(id, this.ownerId)
      .run();
  }

  async countByCategory(categoryId: string): Promise<number> {
    const row = await this.db
      .prepare('SELECT COUNT(*) AS total FROM transactions WHERE user_id = ? AND category_id = ?')
      .bind(this.ownerId, categoryId)
      .first<{ total: number }>();
    return row?.total ?? 0;
  }

  private buildWhere(filter: TransactionFilter): WhereClause {
    const conditions = ['user_id = ?'];
    const params: unknown[] = [this.ownerId];

    if (filter.from) {
      conditions.push('occurred_on >= ?');
      params.push(filter.from.toString());
    }
    if (filter.to) {
      conditions.push('occurred_on <= ?');
      params.push(filter.to.toString());
    }
    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.categoryId) {
      conditions.push('category_id = ?');
      params.push(filter.categoryId);
    }

    return { sql: `WHERE ${conditions.join(' AND ')}`, params };
  }
}

function toEntity(row: TransactionRow): Transaction {
  return Transaction.restore({
    id: row.id,
    description: row.description,
    amount: Money.fromCents(row.amount_cents),
    type: row.type,
    categoryId: row.category_id,
    occurredOn: CalendarDate.parse(row.occurred_on),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}
