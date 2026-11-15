import { z } from 'zod';

export const EmailSchema = z.string().trim().toLowerCase().email('Invalid email').max(254);

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: EmailSchema,
  password: z.string().min(8, 'Password must have at least 8 characters').max(128),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponseDTO {
  token: string;
  /** ISO 8601 */
  expiresAt: string;
  user: UserDTO;
}
