// Unit tests for the PURE predicates in lib/auth. The hooks themselves need a
// reactive root + QueryClient context and are covered elsewhere; only the
// deterministic, side-effect-free helpers are tested here.
import { describe, expect, it, mock } from 'bun:test';
import type { User } from '@todo/domain';
import { isAdmin, requireAdmin, requireAuth } from '../../src/lib/auth';

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

describe('isAdmin', () => {
  it('returns true for an admin user', () => {
    expect(isAdmin(makeUser({ role: 'admin' }))).toBe(true);
  });

  it('returns false for a regular user', () => {
    expect(isAdmin(makeUser({ role: 'user' }))).toBe(false);
  });

  it('returns false for null (logged out)', () => {
    expect(isAdmin(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('requireAuth', () => {
  it('returns true while the session is loading (gate stays open)', () => {
    const navigate = mock(() => {});
    expect(requireAuth(null, true, navigate)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns true and does not navigate when a user is present', () => {
    const navigate = mock(() => {});
    expect(requireAuth(makeUser(), false, navigate)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login and returns false when no user and loading is done', () => {
    const navigate = mock(() => {});
    expect(requireAuth(null, false, navigate)).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});

describe('requireAdmin', () => {
  it('returns true while the session is loading', () => {
    const navigate = mock(() => {});
    expect(requireAdmin(null, true, navigate)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns true for an admin once loaded', () => {
    const navigate = mock(() => {});
    expect(requireAdmin(makeUser({ role: 'admin' }), false, navigate)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects a non-admin (regular user) to /login', () => {
    const navigate = mock(() => {});
    expect(requireAdmin(makeUser({ role: 'user' }), false, navigate)).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('redirects a logged-out user to /login', () => {
    const navigate = mock(() => {});
    expect(requireAdmin(null, false, navigate)).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
