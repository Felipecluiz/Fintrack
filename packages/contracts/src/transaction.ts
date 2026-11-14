import { z } from 'zod';
import {
  IsoDateSchema,
  PaginationQuerySchema,
  TransactionTypeSchema,
  type TransactionType,
} from './common';

/** R$ 10 milhões em centavos: limite de sanidade para entrada manual. */
const MAX_AMOUNT_CENTS = 1_000_000_000;

const TransactionFieldsSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(120),
  amountCents: z.number().int().positive().max(MAX_AMOUNT_CENTS),
  type: TransactionTypeSchema,
  categoryId: z.string().uuid(),
  occurredOn: IsoDateSchema,
});

export const CreateTransactionSchema = TransactionFieldsSchema;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = TransactionFieldsSchema.partial().refine(
  (changes) => Object.keys(changes).length > 0,
  { message: 'At least one field must be provided' },
);
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

export const ListTransactionsQuerySchema = PaginationQuerySchema.extend({
  from: IsoDateSchema.optional(),
  to: IsoDateSchema.optional(),
  type: TransactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
});
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;

export interface TransactionDTO {
  id: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  categoryId: string;
  occurredOn: string;
  createdAt: string;
  updatedAt: string;
}
