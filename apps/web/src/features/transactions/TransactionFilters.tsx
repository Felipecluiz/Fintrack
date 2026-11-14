import type { CategoryDTO, TransactionType } from '@fintrack/contracts';
import { TRANSACTION_TYPE_LABEL } from '../../shared/labels';

export interface Filters {
  from: string;
  to: string;
  type: TransactionType | '';
  categoryId: string;
}

export const EMPTY_FILTERS: Filters = { from: '', to: '', type: '', categoryId: '' };

interface TransactionFiltersProps {
  value: Filters;
  categories: CategoryDTO[];
  onChange: (filters: Filters) => void;
}

export function TransactionFilters({ value, categories, onChange }: TransactionFiltersProps) {
  const set = <K extends keyof Filters>(key: K, next: Filters[K]) =>
    onChange({ ...value, [key]: next });
  const visibleCategories = value.type
    ? categories.filter((c) => c.type === value.type)
    : categories;
  const hasFilters = Object.values(value).some(Boolean);

  return (
    <div className="filters" role="search">
      <label className="field">
        <span>De</span>
        <input type="date" value={value.from} onChange={(e) => set('from', e.target.value)} />
      </label>
      <label className="field">
        <span>Até</span>
        <input type="date" value={value.to} onChange={(e) => set('to', e.target.value)} />
      </label>
      <label className="field">
        <span>Tipo</span>
        <select
          value={value.type}
          onChange={(e) =>
            onChange({ ...value, type: e.target.value as Filters['type'], categoryId: '' })
          }
        >
          <option value="">Todos</option>
          <option value="income">{TRANSACTION_TYPE_LABEL.income}</option>
          <option value="expense">{TRANSACTION_TYPE_LABEL.expense}</option>
        </select>
      </label>
      <label className="field">
        <span>Categoria</span>
        <select value={value.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
          <option value="">Todas</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      {hasFilters && (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
