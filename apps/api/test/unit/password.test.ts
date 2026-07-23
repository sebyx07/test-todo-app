import { describe, expect, it } from 'bun:test';
import { hashPassword, verifyPassword } from '../../src/lib/password';

describe('password hashing', () => {
  it('verifies a correct password (round-trip)', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(await verifyPassword('totally different password', hash)).toBe(false);
  });

  it('produces a salted hash that differs from the plaintext and across calls', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');

    expect(a).not.toBe('same-password');
    expect(a).not.toBe(b);
  });
});
