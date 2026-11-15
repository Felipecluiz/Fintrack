import type { UserDTO } from '@fintrack/contracts';
import { UnauthorizedError } from '../../domain/shared/errors';
import type { UserRepository } from '../../domain/user/UserRepository';
import { toUserDTO } from './UserMapper';

export class GetCurrentUser {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserDTO> {
    const user = await this.users.findById(userId);
    if (!user) {
      // Token válido de uma conta que não existe mais.
      throw new UnauthorizedError('Account not found');
    }
    return toUserDTO(user);
  }
}
