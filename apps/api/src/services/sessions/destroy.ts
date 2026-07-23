// Destroy session — logout. Thin wrapper over the repository delete; one verb per
// file, mirroring services/todos (creator/updater/remover are separate modules).
import type { Database } from 'bun:sqlite';
import { deleteSessionByToken } from './repository';

/** Delete the session backing `token`. No-op when it does not exist. */
export function destroy(db: Database, token: string): void {
  deleteSessionByToken(db, token);
}
