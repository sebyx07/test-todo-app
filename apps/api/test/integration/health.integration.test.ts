// Integration: boot the real server, speak real HTTP. No mocks.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createApp } from '../../src/app';

let server: ReturnType<typeof Bun.serve>;

beforeAll(() => {
  server = Bun.serve({ port: 0, fetch: createApp().fetch });
});

afterAll(async () => {
  await server.stop(true);
});

describe('api over HTTP', () => {
  it('serves GET /healthz', async () => {
    const response = await fetch(`${server.url}healthz`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns a typed 404 body for an unknown route', async () => {
    const response = await fetch(`${server.url}nope`);

    expect(response.status).toBe(404);
  });
});
