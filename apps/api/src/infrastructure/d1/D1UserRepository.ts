import { Email } from '../../domain/user/Email';
import { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export class D1UserRepository implements UserRepository {
  constructor(private readonly db: D1Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<UserRow>();
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email.toString())
      .first<UserRow>();
    return row ? toEntity(row) : null;
  }

  async save(user: User): Promise<void> {
    const u = user.toSnapshot();
    await this.db
      .prepare(
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           name = excluded.name,
           email = excluded.email,
           password_hash = excluded.password_hash`,
      )
      .bind(u.id, u.name, u.email.toString(), u.passwordHash, u.createdAt.toISOString())
      .run();
  }
}

function toEntity(row: UserRow): User {
  return User.restore({
    id: row.id,
    name: row.name,
    email: Email.parse(row.email),
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at),
  });
}
