// Zod-validated process env. Fails loudly at boot, never mid-request.
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DB_PATH: z.string().default(':memory:'),
  DATABASE_URL: z.url().optional(),
  REDIS_URL: z.url().optional(),
  SESSION_COOKIE_NAME: z.string().default('session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  COOKIE_SECURE: z
    .preprocess((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'true';
      return false;
    }, z.boolean())
    .default(false),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse(process.env);
