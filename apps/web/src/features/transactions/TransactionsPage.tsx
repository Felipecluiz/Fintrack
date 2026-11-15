import type { TransactionDTO } from '@fintrack/contracts';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../shared/lib/dates';
import { formatCents } from '../../shared/lib/money';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { PageHeader } from '../../shared/ui/PageHeader';
import { useToast } from '../../shared/ui/Toaster';
import { useCategories } from '../categories/hooks';
import { useDeleteTransaction, useTransactions } from './hooks';
import { EMPTY_FILTERS, TransactionFilters, type Filters } from './TransactionFilters';
import { TransactionForm } from './TransactionForm';

const PAGE_SIZE = 15;

type Editing = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; transaction: TransactionDTO };

export function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing>({ mode: 'closed' });

  const categories = useCategories();
  const transactions = useTransactions({
    page,
    pageSize: PAGE_SIZE,
    from: filters.from || undefined,
    to: filters.to || undefined,
    type: filters.type || undefined,
    categoryId: filters.categoryId || undefined,
  });
  const deleteTransaction = useDeleteTransaction();
  const notify = useToast();

  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  );
  const totalPages = Math.max(1, Math.ceil((transactions.data?.total ?? 0) / PAGE_SIZE));

  const changeFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const confirmDelete = (transaction: TransactionDTO) => {
    if (window.confirm(`Excluir "${transaction.description}"?`)) {
      deleteTransaction.mutate(transaction.id, {
        onSuccess: () => notify('Transação excluída'),
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Transações"
        description="Tudo o que entrou e saiu, do mais recente para o mais antigo."
        actions={
          <button className="button button--primary" onClick={() => setEditing({ mode: 'new' })}>
            Nova transação
          </button>
        }
      />

      {editing.mode !== 'closed' && (
        <TransactionForm
          key={editing.mode === 'edit' ? editing.transaction.id : 'new'}
          transaction={editing.mode === 'edit' ? editing.transaction : undefined}
          categories={categories.data ?? []}
          onClose={() => setEditing({ mode: 'closed' })}
        />
      )}

      <section className="card">
        <TransactionFilters
          value={filters}
          categories={categories.data ?? []}
          onChange={changeFilters}
        />
        <ErrorBanner error={transactions.error ?? deleteTransaction.error} />

        {transactions.isLoading ? (
          <p className="muted">Carregando…</p>
        ) : transactions.data?.items.length === 0 ? (
          <EmptyState title="Nenhuma transação encontrada.">
            {categories.data?.length === 0 && (
              <>
                Comece criando suas <Link to="/app/categories">categorias</Link>.
              </>
            )}
          </EmptyState>
        ) : (
          <div className="table-wrapper">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Categoria</th>
                  <th scope="col" className="numeric">
                    Valor
                  </th>
                  <th scope="col">
                    <span className="visually-hidden">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.data?.items.map((transaction) => (
                  <tr key={transaction.id}>
                    <td data-label="Data">{formatDate(transaction.occurredOn)}</td>
                    <td data-label="Descrição">{transaction.description}</td>
                    <td data-label="Categoria" className="muted">{categoryNames.get(transaction.categoryId) ?? '—'}</td>
                    <td data-label="Valor" className="numeric">
                      <span className={`amount amount--${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '−'}{' '}
                        {formatCents(transaction.amountCents)}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button
                        className="button button--ghost button--small"
                        onClick={() => setEditing({ mode: 'edit', transaction })}
                      >
                        Editar
                      </button>
                      <button
                        className="button button--ghost button--small button--danger"
                        onClick={() => confirmDelete(transaction)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav className="pagination" aria-label="Paginação">
          <button
            className="button button--ghost button--small"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            ← Anterior
          </button>
          <span className="muted">
            Página {page} de {totalPages} · {transactions.data?.total ?? 0} transações
          </span>
          <button
            className="button button--ghost button--small"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Próxima →
          </button>
        </nav>
      </section>
    </>
  );
}
