import type { TransactionType } from '@fintrack/contracts';
import { useState, type FormEvent } from 'react';
import { TRANSACTION_TYPE_LABEL } from '../../shared/labels';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { useCreateCategory } from './hooks';

export function NewCategoryForm() {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const createCategory = useCreateCategory();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createCategory.mutate({ name, type }, { onSuccess: () => setName('') });
  };

  return (
    <form className="card form-inline" onSubmit={submit}>
      <label className="field field--grow">
        <span>Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Mercado"
          maxLength={50}
          required
        />
      </label>
      <label className="field">
        <span>Tipo</span>
        <select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="expense">{TRANSACTION_TYPE_LABEL.expense}</option>
          <option value="income">{TRANSACTION_TYPE_LABEL.income}</option>
        </select>
      </label>
      <button className="button button--primary" disabled={createCategory.isPending}>
        Adicionar
      </button>
      {createCategory.isError && (
        <div className="form-inline__error">
          <ErrorBanner error={createCategory.error} />
        </div>
      )}
    </form>
  );
}
