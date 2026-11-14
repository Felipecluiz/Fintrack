import type { CategoryDTO, TransactionType } from '@fintrack/contracts';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { PageHeader } from '../../shared/ui/PageHeader';
import { CategoryRow } from './CategoryRow';
import { useCategories } from './hooks';
import { NewCategoryForm } from './NewCategoryForm';

export function CategoriesPage() {
  const categories = useCategories();
  const byType = (type: TransactionType) => (categories.data ?? []).filter((c) => c.type === type);

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Receitas e despesas são agrupadas por categoria. O tipo não muda depois de criado."
      />
      <NewCategoryForm />
      <ErrorBanner error={categories.error} />

      <div className="grid grid--2">
        <CategoryList title="Despesas" items={byType('expense')} isLoading={categories.isLoading} />
        <CategoryList title="Receitas" items={byType('income')} isLoading={categories.isLoading} />
      </div>
    </>
  );
}

interface CategoryListProps {
  title: string;
  items: CategoryDTO[];
  isLoading: boolean;
}

function CategoryList({ title, items, isLoading }: CategoryListProps) {
  return (
    <section className="card">
      <h2 className="card__title">
        {title} <span className="muted">({items.length})</span>
      </h2>
      {isLoading ? (
        <p className="muted">Carregando…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Nenhuma categoria ainda." />
      ) : (
        <ul className="list">
          {items.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </section>
  );
}
