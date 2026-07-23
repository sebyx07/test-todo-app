import { describe, expect, it } from 'bun:test';
import { createApp } from '../../src/app';

describe('GET /healthz', () => {
  it('returns ok', async () => {
    const response = await createApp().request('/healthz');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
