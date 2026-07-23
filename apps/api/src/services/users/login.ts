// Login user — the authentication boundary. Parses the input, loads the user +
// stored password hash, and verifies the password. Returns the safe User on
// success. Throws UnauthorizedError when the email is unknown OR the password is
// wrong (identical error to avoid user-enumeration).
import type { Database } from 'bun:sqlite';
import { type CreateUserInput, createUserSchema, type User } from '@todo/domain';
import { UnauthorizedError } from '../../errors';
import { verifyPassword } from '../../lib/password';
import { findUserCredentialsByEmail } from './repository';

/** Verify credentials and return the user. */
export async function login(db: Database, input: CreateUserInput): Promise<User> {
  const parsed = createUserSchema.parse(input);

  const credentials = findUserCredentialsByEmail(db, parsed.email);
  if (!credentials) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await verifyPassword(parsed.password, credentials.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return credentials.user;
}
