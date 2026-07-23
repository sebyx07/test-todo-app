// Register user — the validation + uniqueness boundary for sign-up. Parses the raw
// input with createUserSchema (email format + password min length), rejects a
// duplicate email with ConflictError, hashes the password, and persists via the
// repository. Returns the new User (no password hash).
import type { Database } from 'bun:sqlite';
import { type CreateUserInput, createUserSchema, type User } from '@todo/domain';
import { ConflictError } from '../../errors';
import { hashPassword } from '../../lib/password';
import { findUserByEmail, insertUser } from './repository';

/** Validate, dedupe, hash, and persist a new user. */
export async function register(db: Database, input: CreateUserInput): Promise<User> {
  const parsed = createUserSchema.parse(input);

  const existing = findUserByEmail(db, parsed.email);
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const passwordHash = await hashPassword(parsed.password);
  return insertUser(db, { email: parsed.email, passwordHash });
}
