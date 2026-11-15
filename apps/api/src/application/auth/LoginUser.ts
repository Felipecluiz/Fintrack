import type { AuthResponseDTO, LoginInput } from '@fintrack/contracts';
import { UnauthorizedError, ValidationError } from '../../domain/shared/errors';
import { Email } from '../../domain/user/Email';
import type { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { PasswordHasher } from './ports/PasswordHasher';
import type { TokenService } from './ports/TokenService';
import { toAuthResponse } from './UserMapper';

/** BR-407: a mesma mensagem para e-mail inexistente e senha errada. */
const INVALID_CREDENTIALS = 'Invalid email or password';

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<AuthResponseDTO> {
    const user = await this.findUser(input.email);
    const passwordMatches = await this.hasher.verify(input.password, user?.passwordHash ?? null);

    if (!user || !passwordMatches) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    return toAuthResponse(user, await this.tokens.issue(user.id));
  }

  private async findUser(rawEmail: string): Promise<User | null> {
    try {
      return await this.users.findByEmail(Email.parse(rawEmail));
    } catch (error) {
      if (error instanceof ValidationError) return null;
      throw error;
    }
  }
}
