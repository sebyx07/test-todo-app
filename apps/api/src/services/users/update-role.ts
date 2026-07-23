// Update a user's role — the validation + lockout-prevention boundary for admins.
// Parses the role via roleSchema, loads the target, then rejects self-demotion and
// last-admin demotion before persisting. Both guards throw ForbiddenError so an admin
// can never strand the platform with zero admins.
import type { Database } from 'bun:sqlite';
import { type Role, roleSchema, type User } from '@todo/domain';
import { ForbiddenError, NotFoundError } from '../../errors';
import { countAdmins, findUserById, updateUserRole as persistRole } from './repository';

export interface UpdateRoleInput {
  role: unknown;
}

/** Validate the role and apply it, enforcing the lockout guards. */
export function updateRole(
  db: Database,
  actorId: string,
  targetId: string,
  input: UpdateRoleInput,
): User {
  const role = roleSchema.parse(input.role) as Role;

  const target = findUserById(db, targetId);
  if (!target) {
    throw new NotFoundError('User');
  }

  // An admin must not strip their own admin rights.
  if (actorId === targetId && role !== 'admin') {
    throw new ForbiddenError('You cannot change your own role');
  }

  // Never let the platform reach zero admins.
  if (target.role === 'admin' && role === 'user' && countAdmins(db) <= 1) {
    throw new ForbiddenError('Cannot demote the last admin');
  }

  return persistRole(db, targetId, role);
}
