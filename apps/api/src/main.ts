// Boot. Keep this file trivial — everything testable lives in app.ts and below.
import { createApp } from './app';
import { env } from './env';

const app = createApp();

console.error(`▸ api listening on http://localhost:${env.API_PORT}`);

export default {
  port: env.API_PORT,
  fetch: app.fetch,
};
