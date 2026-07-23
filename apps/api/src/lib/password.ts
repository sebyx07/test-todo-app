// Password hashing — shared by register and login. Wraps Bun.password so the
// algorithm is fixed in one place. Bun ships crypto; no extra dependency.
const ALGORITHM = 'argon2id';

/** Hash a plaintext password with argon2id. Returns a self-describing hash string. */
export function hashPassword(plaintext: string): Promise<string> {
  return Bun.password.hash(plaintext, { algorithm: ALGORITHM });
}

/** Verify a plaintext password against a stored hash. Auto-detects the algorithm. */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plaintext, hash);
}
