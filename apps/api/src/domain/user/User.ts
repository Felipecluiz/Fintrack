import { ValidationError } from '../shared/errors';
import type { Email } from './Email';

const NAME_MAX_LENGTH = 80;

export interface UserSnapshot {
  id: string;
  name: string;
  email: Email;
  /** Hash produzido por um `PasswordHasher`; a senha em si nunca chega aqui. */
  passwordHash: string;
  createdAt: Date;
}

export interface NewUser {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  now: Date;
}

export class User {
  private constructor(private readonly state: UserSnapshot) {}

  static create({ id, name, email, passwordHash, now }: NewUser): User {
    return new User({ id, name: User.normalizeName(name), email, passwordHash, createdAt: now });
  }

  static restore(snapshot: UserSnapshot): User {
    return new User({ ...snapshot });
  }

  get id(): string {
    return this.state.id;
  }

  get email(): Email {
    return this.state.email;
  }

  get passwordHash(): string {
    return this.state.passwordHash;
  }

  toSnapshot(): UserSnapshot {
    return { ...this.state };
  }

  private static normalizeName(raw: string): string {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (name.length === 0) {
      throw new ValidationError('Name is required');
    }
    if (name.length > NAME_MAX_LENGTH) {
      throw new ValidationError(`Name must have at most ${NAME_MAX_LENGTH} characters`);
    }
    return name;
  }
}
