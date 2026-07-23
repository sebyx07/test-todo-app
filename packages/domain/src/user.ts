// Pure User domain types + Zod schemas. No I/O, no framework imports — this is @todo/domain.
import { z } from 'zod';

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export const roleSchema = z.enum(['user', 'admin']);

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: roleSchema,
  createdAt: z.union([z.string(), z.number()]),
  updatedAt: z.union([z.string(), z.number()]),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
