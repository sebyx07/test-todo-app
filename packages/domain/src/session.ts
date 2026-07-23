// Pure Session domain types. No I/O, no framework imports — this is @todo/domain.
import { z } from 'zod';

export interface Session {
  token: string;
  userId: string;
  expiresAt: string | number;
  createdAt: string | number;
}

export const sessionSchema = z.object({
  token: z.string(),
  userId: z.string(),
  expiresAt: z.union([z.string(), z.number()]),
  createdAt: z.union([z.string(), z.number()]),
});
