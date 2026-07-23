import { describe, expect, it } from 'bun:test';
import type { SessionRow, UserRow } from './src/index';
import { mapSessionRow, mapUserRow } from './src/index';

describe('row mappers', () => {
  it('mapUserRow maps columns and strips password_hash', () => {
    const row: UserRow = {
      id: 'u1',
      email: 'user@example.com',
      password_hash: 'hashed-secret',
      role: 'user',
      created_at: '2026-07-23T00:00:00.000Z',
      updated_at: '2026-07-23T00:00:00.000Z',
    };

    const user = mapUserRow(row);

    expect(user).toEqual({
      id: 'u1',
      email: 'user@example.com',
      role: 'user',
      createdAt: '2026-07-23T00:00:00.000Z',
      updatedAt: '2026-07-23T00:00:00.000Z',
    });
    expect('password_hash' in user).toBe(false);
  });

  it('mapSessionRow maps columns', () => {
    const row: SessionRow = {
      token: 'tok',
      user_id: 'u1',
      expires_at: '2026-07-24T00:00:00.000Z',
      created_at: '2026-07-23T00:00:00.000Z',
    };

    expect(mapSessionRow(row)).toEqual({
      token: 'tok',
      userId: 'u1',
      expiresAt: '2026-07-24T00:00:00.000Z',
      createdAt: '2026-07-23T00:00:00.000Z',
    });
  });
});
