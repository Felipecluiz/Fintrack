import type { CategoryExpenseDTO } from '@fintrack/contracts';
import { formatCents } from '../../shared/lib/money';
import { EmptyState } from '../../shared/ui/EmptyState';

const MAX_ROWS = 6;

/**
 * Ranking de despesas por categoria (BR-305). É uma comparação de magnitude,
 * então usa uma única cor; o nome e o valor ficam escritos ao lado da barra.
 */
export function CategoryRanking({ items }: { items: CategoryExpenseDTO[] }) {
  const rows = foldIntoOther(items);
  const total = items.reduce((sum, item) => sum + item.totalCents, 0);
  const largest = rows[0]?.totalCents ?? 1;

  return (
    <section className="card">
      <h2 className="card__title">Onde o dinheiro foi</h2>
      {rows.length === 0 ? (
        <EmptyState title="Nenhuma despesa no período." />
      ) : (
        <ul className="ranking">
          {rows.map((row) => (
            <li key={row.categoryId} className="ranking__row">
              <div className="ranking__labels">
                <span>{row.categoryName}</span>
                <span className="ranking__value">
                  {formatCents(row.totalCents)}
                  <span className="muted"> · {Math.round((row.totalCents / total) * 100)}%</span>
                </span>
              </div>
              <div className="ranking__track">
                <div
                  className="ranking__bar"
                  style={{ width: `${(row.totalCents / largest) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Mantém as maiores categorias e agrupa o restante em "Outras". */
function foldIntoOther(items: CategoryExpenseDTO[]): CategoryExpenseDTO[] {
  if (items.length <= MAX_ROWS) return items;
  const head = items.slice(0, MAX_ROWS - 1);
  const rest = items.slice(MAX_ROWS - 1);
  return [
    ...head,
    {
      categoryId: '__other__',
      categoryName: `Outras (${rest.length})`,
      totalCents: rest.reduce((sum, item) => sum + item.totalCents, 0),
    },
  ];
}
