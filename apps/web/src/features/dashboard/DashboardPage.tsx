import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../shared/lib/dates';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { PageHeader } from '../../shared/ui/PageHeader';
import { SegmentedControl } from '../../shared/ui/SegmentedControl';
import { useDashboardSummary } from './api';
import { CategoryRanking } from './CategoryRanking';
import { MonthlyChart } from './MonthlyChart';
import { StatTiles } from './StatTiles';

const PERIOD_OPTIONS = [
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
];

export function DashboardPage() {
  const [months, setMonths] = useState(6);
  const summary = useDashboardSummary(months);
  const data = summary.data;
  const isEmpty = data && data.totals.incomeCents === 0 && data.totals.expenseCents === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data
            ? `${formatDate(data.period.from)} a ${formatDate(data.period.to)}`
            : 'Visão geral do período'
        }
        actions={
          <SegmentedControl
            label="Período"
            options={PERIOD_OPTIONS}
            value={months}
            onChange={setMonths}
          />
        }
      />

      <ErrorBanner error={summary.error} />
      {summary.isLoading && <p className="muted">Carregando…</p>}

      {data && (
        <>
          <StatTiles totals={data.totals} />
          {isEmpty ? (
            <section className="card">
              <EmptyState title="Sem movimento neste período.">
                Registre suas <Link to="/transactions">transações</Link> para ver os gráficos.
              </EmptyState>
            </section>
          ) : (
            <div className="grid grid--dashboard">
              <MonthlyChart data={data.monthly} />
              <CategoryRanking items={data.expensesByCategory} />
            </div>
          )}
        </>
      )}
    </>
  );
}
