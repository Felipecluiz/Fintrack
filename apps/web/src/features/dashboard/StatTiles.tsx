import type { DashboardSummaryDTO } from '@fintrack/contracts';
import { formatCents } from '../../shared/lib/money';

export function StatTiles({ totals }: { totals: DashboardSummaryDTO['totals'] }) {
  const savingsRate =
    totals.incomeCents > 0 ? Math.round((totals.balanceCents / totals.incomeCents) * 100) : null;

  return (
    <div className="grid grid--3">
      <Tile label="Receitas" value={formatCents(totals.incomeCents)} marker="income" />
      <Tile label="Despesas" value={formatCents(totals.expenseCents)} marker="expense" />
      <Tile
        label="Saldo"
        value={formatCents(totals.balanceCents)}
        hint={savingsRate === null ? undefined : `${savingsRate}% da receita guardada`}
      />
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
  hint?: string;
  marker?: 'income' | 'expense';
}

function Tile({ label, value, hint, marker }: TileProps) {
  return (
    <div className="card stat">
      <span className="stat__label">
        {marker && <span className={`swatch swatch--${marker}`} aria-hidden />}
        {label}
      </span>
      <span className="stat__value">{value}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  );
}
