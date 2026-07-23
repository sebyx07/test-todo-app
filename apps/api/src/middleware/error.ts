// One job: map a thrown error to an HTTP response. Unknown errors never leak internals.
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export function errorHandler(error: Error, c: Context): Response {
  if (error instanceof AppError) {
    return c.json(
      { error: { code: error.code, message: error.message } },
      error.status as ContentfulStatusCode,
    );
  }

  if (error instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'validation_error',
          message: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      },
      422,
    );
  }

  console.error(error);
  return c.json({ error: { code: 'internal_error', message: 'Internal Server Error' } }, 500);
}
