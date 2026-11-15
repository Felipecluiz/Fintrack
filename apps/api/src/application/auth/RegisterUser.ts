import type { AuthResponseDTO, RegisterInput } from '@fintrack/contracts';
import { ConflictError } from '../../domain/shared/errors';
import { Email } from '../../domain/user/Email';
import { assertStrongPassword } from '../../domain/user/passwordPolicy';
import { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { Clock } from '../ports/Clock';
import type { IdGenerator } from '../ports/IdGenerator';
import type { PasswordHasher } from './ports/PasswordHasher';
import type { TokenService } from './ports/TokenService';
import { toAuthResponse } from './UserMapper';

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RegisterInput): Promise<AuthResponseDTO> {
    const email = Email.parse(input.email);
    assertStrongPassword(input.password);

    if (await this.users.findByEmail(email)) {
      throw new ConflictError('An account with this email already exists');
    }

    const user = User.create({
      id: this.ids.next(),
      name: input.name,
      email,
      passwordHash: await this.hasher.hash(input.password),
      now: this.clock.now(),
    });
    await this.users.save(user);

    return toAuthResponse(user, await this.tokens.issue(user.id));
  }
}
