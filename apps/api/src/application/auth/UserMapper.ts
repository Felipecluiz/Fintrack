import type { AuthResponseDTO, UserDTO } from '@fintrack/contracts';
import type { User } from '../../domain/user/User';
import type { IssuedToken } from './ports/TokenService';

/** Nunca inclui o hash da senha (BR-403). */
export function toUserDTO(user: User): UserDTO {
  const { id, name, email, createdAt } = user.toSnapshot();
  return { id, name, email: email.toString(), createdAt: createdAt.toISOString() };
}

export function toAuthResponse(user: User, issued: IssuedToken): AuthResponseDTO {
  return {
    token: issued.token,
    expiresAt: issued.expiresAt.toISOString(),
    user: toUserDTO(user),
  };
}
