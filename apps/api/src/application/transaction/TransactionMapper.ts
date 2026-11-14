import type { TransactionDTO } from '@fintrack/contracts';
import type { Transaction } from '../../domain/transaction/Transaction';

export function toTransactionDTO(transaction: Transaction): TransactionDTO {
  const snapshot = transaction.toSnapshot();
  return {
    id: snapshot.id,
    description: snapshot.description,
    amountCents: snapshot.amount.cents,
    type: snapshot.type,
    categoryId: snapshot.categoryId,
    occurredOn: snapshot.occurredOn.toString(),
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}
