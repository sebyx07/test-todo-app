import { describe, expect, it } from 'bun:test';
import { createUserSchema, roleSchema } from './src/index';

describe('user schemas', () => {
  it('createUserSchema accepts a valid email and password', () => {
    expect(createUserSchema.parse({ email: 'user@example.com', password: 'secret123' })).toEqual({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  it('createUserSchema rejects a malformed email', () => {
    expect(() =>
      createUserSchema.parse({ email: 'not-an-email', password: 'secret123' }),
    ).toThrow();
  });

  it('createUserSchema rejects a short password', () => {
    expect(() =>
      createUserSchema.parse({ email: 'user@example.com', password: 'short' }),
    ).toThrow();
  });

  it('roleSchema accepts the two valid roles', () => {
    expect(roleSchema.parse('user')).toBe('user');
    expect(roleSchema.parse('admin')).toBe('admin');
  });

  it('roleSchema rejects an unknown role', () => {
    expect(() => roleSchema.parse('superuser')).toThrow();
  });
});
