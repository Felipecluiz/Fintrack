import type { CategoryDTO, TransactionDTO, TransactionType } from '@fintrack/contracts';
import { useState, type FormEvent } from 'react';
import { todayIso } from '../../shared/lib/dates';
import { centsToInput, parseAmountToCents } from '../../shared/lib/money';
import { ErrorBanner } from '../../shared/ui/ErrorBanner';
import { SegmentedControl } from '../../shared/ui/SegmentedControl';
import { useSaveTransaction } from './hooks';

interface TransactionFormProps {
  /** Ausente = nova transação. */
  transaction?: TransactionDTO;
  categories: CategoryDTO[];
  onClose: () => void;
}

export function TransactionForm({ transaction, categories, onClose }: TransactionFormProps) {
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(transaction ? centsToInput(transaction.amountCents) : '');
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '');
  const [occurredOn, setOccurredOn] = useState(transaction?.occurredOn ?? todayIso());
  const [amountError, setAmountError] = useState<string | null>(null);
  const saveTransaction = useSaveTransaction();

  const categoriesOfType = categories.filter((c) => c.type === type);

  /** BR-204 na interface: trocar o tipo limpa uma categoria incompatível. */
  const changeType = (next: TransactionType) => {
    setType(next);
    if (!categories.some((c) => c.id === categoryId && c.type === next)) {
      setCategoryId('');
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amountCents = parseAmountToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setAmountError('Informe um valor maior que zero, ex.: 1.234,56');
      return;
    }
    setAmountError(null);
    saveTransaction.mutate(
      {
        id: transaction?.id,
        input: { description, amountCents, type, categoryId, occurredOn },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <form className="card form" onSubmit={submit}>
      <div className="form__header">
        <h2 className="card__title">{transaction ? 'Editar transação' : 'Nova transação'}</h2>
        <SegmentedControl
          label="Tipo"
          value={type}
          onChange={changeType}
          options={[
            { value: 'expense', label: 'Despesa' },
            { value: 'income', label: 'Receita' },
          ]}
        />
      </div>

      <div className="form__grid">
        <label className="field field--wide">
          <span>Descrição</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>Valor (R$)</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            aria-invalid={amountError !== null}
            required
          />
          {amountError && <small className="field__error">{amountError}</small>}
        </label>
        <label className="field">
          <span>Data</span>
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            required
          />
        </label>
        <label className="field field--wide">
          <span>Categoria</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="" disabled>
              {categoriesOfType.length
                ? 'Selecione…'
                : 'Cadastre uma categoria deste tipo primeiro'}
            </option>
            {categoriesOfType.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ErrorBanner error={saveTransaction.error} />

      <div className="form__actions">
        <button type="button" className="button button--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="button button--primary" disabled={saveTransaction.isPending}>
          {saveTransaction.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
