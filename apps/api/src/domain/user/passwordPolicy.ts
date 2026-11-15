import { ValidationError } from '../shared/errors';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/** BR-402: 8 a 128 caracteres, com pelo menos uma letra e um número. */
export function assertStrongPassword(password: string): void {
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    throw new ValidationError(
      `Password must have between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
    );
  }
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    throw new ValidationError('Password must contain at least one letter and one number');
  }
}
