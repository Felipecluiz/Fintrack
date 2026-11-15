import { ValidationError } from '../shared/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

/** E-mail normalizado (minúsculas, sem espaços) — BR-401. */
export class Email {
  private constructor(private readonly value: string) {}

  static parse(raw: string): Email {
    const value = raw.trim().toLowerCase();
    if (value.length > MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
      throw new ValidationError(`"${raw}" is not a valid email`);
    }
    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
