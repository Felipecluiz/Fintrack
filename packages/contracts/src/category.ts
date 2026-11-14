import { z } from 'zod';
import { TransactionTypeSchema, type TransactionType } from './common';

const CategoryNameSchema = z.string().trim().min(1, 'Name is required').max(50);

export const CreateCategorySchema = z.object({
  name: CategoryNameSchema,
  type: TransactionTypeSchema,
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: CategoryNameSchema,
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export interface CategoryDTO {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: string;
  updatedAt: string;
}
