// Component tests for the Admin page. <Admin> is a container that wires its own
// hooks, so — unlike presentational components — it can't take handlers as
// props. We mount it inside the real provider stack (QueryClient + Router) and
// pre-seed every cache it reads (session, users, stats) with staleTime:
// Infinity so it renders synchronously with NO network. Clicking a role /
// Delete button must then fire the matching mutation, which surfaces as a
// PATCH / DELETE with the right path + body through lib/api. Mirrors the
// cache-seed seam in AppShell.test.tsx and the fetch-mock seam in api.test.ts
// — no module mocking, which would leak across the shared bun test process.

import { afterEach, describe, expect, it, mock } from 'bun:test';
import { Route, Router } from '@solidjs/router';
import { cleanup, render } from '@solidjs/testing-library';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import type { User } from '@todo/domain';
import type { ParentComponent } from 'solid-js';
import { adminKeys, type PlatformStats } from '../../src/lib/admin';
import { sessionKeys } from '../../src/lib/auth';
import Admin from '../../src/routes/Admin';

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

const admin = makeUser({ id: 'admin-1', email: 'admin@x.com', role: 'admin' });

const originalFetch = globalThis.fetch;

interface FetchExpectation {
  method: string;
  suffix: string; // path suffix after /api (e.g. '/admin/users/u1')
  json?: () => Promise<unknown>;
}

/**
 * Route globalThis.fetch by URL + method. BASE_URL in lib/api is '/api', so a
 * call looks like `fetch('/api/admin/users', {...})`. Each expectation matches a
 * `${method} ${suffix}`; unmatched calls throw so a stray request is loud.
 * Returns the mock plus a captured-calls list for assertions.
 */
function mockFetch(expectations: FetchExpectation[]): {
  fn: ReturnType<typeof mock>;
  calls: { url: string; init: RequestInit }[];
} {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = mock((url: string, init?: RequestInit) => {
    calls.push({ url, init: init ?? {} });
    const method = (init?.method ?? 'GET').toUpperCase();
    const exp = expectations.find((e) => e.method === method && url.endsWith(e.suffix));
    if (!exp) throw new Error(`unexpected ${method} ${url}`);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: exp.json ?? (() => Promise.resolve({})),
    });
  });
  globalThis.fetch = fn as unknown as typeof globalThis.fetch;
  return { fn, calls };
}

const Wrap: ParentComponent<{ client: QueryClient }> = (props) => (
  <QueryClientProvider client={props.client}>
    <Router root={Admin}>
      <Route path="/admin" component={() => <>{props.children}</>} />
    </Router>
  </QueryClientProvider>
);

/** Fresh client with the given caches pre-seeded and queries frozen. */
function seedClient(opts: {
  session: User | null;
  users?: User[];
  stats?: PlatformStats;
}): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(sessionKeys.me, opts.session);
  if (opts.users) client.setQueryData(adminKeys.users, opts.users);
  if (opts.stats) client.setQueryData(adminKeys.stats, opts.stats);
  return client;
}

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe('Admin page', () => {
  it('renders the stats counts and the user table for an admin', () => {
    // No fetch expectations → if any request fires, mockFetch throws.
    mockFetch([]);

    const { container, unmount } = render(() => (
      <Wrap
        client={seedClient({
          session: admin,
          users: [makeUser({ id: 'u1', email: 'one@x.com', role: 'user' })],
          stats: { userCount: 5, todoCount: 3 },
        })}
      />
    ));

    const text = container.textContent ?? '';
    expect(text).toContain('one@x.com');
    expect(text).toContain('5');
    expect(text).toContain('3');
    expect(container.querySelector('table')).not.toBeNull();
    unmount();
  });

  it('fires updateUserRole with the toggled role when the role button is clicked', async () => {
    const target = makeUser({ id: 'u1', email: 'one@x.com', role: 'user' });
    const { calls } = mockFetch([
      {
        method: 'PATCH',
        suffix: '/admin/users/u1',
        json: () => Promise.resolve({ ...target, role: 'admin' }),
      },
    ]);

    const { container, unmount } = render(() => (
      <Wrap
        client={seedClient({
          session: admin,
          users: [target],
          stats: { userCount: 1, todoCount: 0 },
        })}
      />
    ));

    const roleButton = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === 'user',
    );
    if (!roleButton) throw new Error('role button not found');
    roleButton.click();
    // The mutation resolves its fetch on the microtask queue; flush before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const patch = calls.find((c) => c.init.method === 'PATCH' && c.url.endsWith('/admin/users/u1'));
    expect(patch).toBeTruthy();
    expect(patch?.init.body).toBe(JSON.stringify({ role: 'admin' }));
    unmount();
  });

  it('fires deleteUser with the row id when Delete is clicked', async () => {
    const target = makeUser({ id: 'u2', email: 'two@x.com', role: 'admin' });
    const { calls } = mockFetch([{ method: 'DELETE', suffix: '/admin/users/u2' }]);

    const { container, unmount } = render(() => (
      <Wrap
        client={seedClient({
          session: admin,
          users: [target],
          stats: { userCount: 1, todoCount: 0 },
        })}
      />
    ));

    const deleteButton = container.querySelector(`[aria-label="Delete ${target.email}"]`);
    if (!deleteButton) throw new Error('delete button not found');
    (deleteButton as HTMLElement).click();
    // The mutation resolves its fetch on the microtask queue; flush before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const del = calls.find((c) => c.init.method === 'DELETE' && c.url.endsWith('/admin/users/u2'));
    expect(del).toBeTruthy();
    unmount();
  });

  it('renders no table when the session is a non-admin (guard redirects)', () => {
    mockFetch([]);

    const { container, unmount } = render(() => (
      <Wrap
        client={seedClient({
          session: makeUser({ role: 'user' }),
          users: [makeUser({ id: 'u1', email: 'one@x.com', role: 'user' })],
          stats: { userCount: 1, todoCount: 0 },
        })}
      />
    ));

    expect(container.querySelector('table')).toBeNull();
    unmount();
  });
});
