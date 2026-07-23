// Unit tests for the PURE optimistic-patch helper in lib/admin. The hooks
// themselves need a reactive root + QueryClient context and are covered
// elsewhere; only the deterministic, side-effect-free patcher is tested here.
import { describe, expect, it } from 'bun:test';
import type { User } from '@todo/domain';
import { applyUserRolePatch } from '../../src/lib/admin';

/** Build a fresh User so tests can never share object references by accident. */
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'a@b.com',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('applyUserRolePatch', () => {
  it('promotes user → admin for the matched user', () => {
    const users = [makeUser({ id: '1', role: 'user' })];

    const result = applyUserRolePatch(users, '1', 'admin');

    expect(result.find((u) => u.id === '1')?.role).toBe('admin');
  });

  it('demotes admin → user for the matched user', () => {
    const users = [makeUser({ id: '1', role: 'admin' })];

    const result = applyUserRolePatch(users, '1', 'user');

    expect(result.find((u) => u.id === '1')?.role).toBe('user');
  });

  it('does not mutate the input array or its users', () => {
    const original = [makeUser({ id: '1', role: 'user' })];
    const snapshot = original.map((u) => ({ ...u }));

    applyUserRolePatch(original, '1', 'admin');

    expect(original).toEqual(snapshot);
    expect(original[0]?.role).toBe('user');
  });

  it('returns a NEW array (referential inequality) with a NEW matched user', () => {
    const user = makeUser({ id: '1', role: 'user' });
    const users = [user];

    const result = applyUserRolePatch(users, '1', 'admin');

    expect(result).not.toBe(users);
    expect(result[0]).not.toBe(user);
  });

  it('leaves sibling users untouched', () => {
    const users = [
      makeUser({ id: '1', role: 'user' }),
      makeUser({ id: '2', role: 'admin' }),
      makeUser({ id: '3', role: 'user' }),
    ];

    const result = applyUserRolePatch(users, '2', 'user');

    expect(result.find((u) => u.id === '1')).toEqual(users[0]);
    expect(result.find((u) => u.id === '2')?.role).toBe('user');
    expect(result.find((u) => u.id === '3')).toEqual(users[2]);
  });

  it('preserves every other field on the matched user', () => {
    const users = [makeUser({ id: '1', email: 'keep@me', role: 'user' })];

    const result = applyUserRolePatch(users, '1', 'admin');

    const patched = result.find((u) => u.id === '1');
    expect(patched?.email).toBe('keep@me');
    expect(patched?.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(patched?.updatedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('returns the list unchanged (new array) when no id matches', () => {
    const users = [makeUser({ id: '1', role: 'user' })];

    const result = applyUserRolePatch(users, 'missing', 'admin');

    expect(result).not.toBe(users);
    expect(result.find((u) => u.id === '1')?.role).toBe('user');
  });

  it('handles an empty list', () => {
    const result = applyUserRolePatch([], '1', 'admin');

    expect(result).toEqual([]);
  });
});
