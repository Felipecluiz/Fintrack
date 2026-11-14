import type {
  CategoryTotal,
  MonthlyTotal,
  Period,
  ReportReader,
  TypeTotals,
} from '../../application/dashboard/ReportReader';

export class D1ReportReader implements ReportReader {
  constructor(private readonly db: D1Database) {}

  async totals({ from, to }: Period): Promise<TypeTotals> {
    const row = await this.db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'income'  THEN amount_cents END), 0) AS incomeCents,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents END), 0) AS expenseCents
         FROM transactions
         WHERE occurred_on BETWEEN ? AND ?`,
      )
      .bind(from.toString(), to.toString())
      .first<TypeTotals>();
    return row ?? { incomeCents: 0, expenseCents: 0 };
  }

  async expensesByCategory({ from, to }: Period): Promise<CategoryTotal[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
           c.id               AS categoryId,
           c.name             AS categoryName,
           SUM(t.amount_cents) AS totalCents
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
         WHERE t.type = 'expense' AND t.occurred_on BETWEEN ? AND ?
         GROUP BY c.id, c.name
         ORDER BY totalCents DESC`,
      )
      .bind(from.toString(), to.toString())
      .all<CategoryTotal>();
    return results;
  }

  async monthlyTotals({ from, to }: Period): Promise<MonthlyTotal[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
           substr(occurred_on, 1, 7) AS month,
           SUM(CASE WHEN type = 'income'  THEN amount_cents ELSE 0 END) AS incomeCents,
           SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) AS expenseCents
         FROM transactions
         WHERE occurred_on BETWEEN ? AND ?
         GROUP BY month
         ORDER BY month`,
      )
      .bind(from.toString(), to.toString())
      .all<MonthlyTotal>();
    return results;
  }
}
