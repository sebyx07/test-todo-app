// Regression test for the AppShell footer copy. The footer used to read
// "scaffold — no features yet" once the todo feature shipped that text became
// stale, so this asserts the current copy and guards against the old wording.

import { afterEach, describe, expect, it } from 'bun:test';
import { Route, Router } from '@solidjs/router';
import { cleanup, render } from '@solidjs/testing-library';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import type { User } from '@todo/domain';
import type { ParentComponent } from 'solid-js';
import { AppShell } from '../../src/components/AppShell';
import { sessionKeys } from '../../src/lib/auth';

const Wrap: ParentComponent<{ client?: QueryClient }> = (props) => {
  // Fresh client per render so HealthBadge's query never leaks between tests.
  // AppShell renders <A> links, which require a Route context — mount it as a
  // layout route so the brand/nav anchors resolve. An optional client lets
  // callers seed the session cache before render (deterministic, no network).
  const client = props.client ?? new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <Router root={AppShell}>
        <Route path="/" component={() => props.children} />
      </Router>
    </QueryClientProvider>
  );
};

describe('AppShell footer', () => {
  it('shows current copy, not the stale scaffold text', () => {
    const { getByText, queryByText, unmount } = render(() => (
      <Wrap>
        <AppShell />
      </Wrap>
    ));

    expect(getByText('todo')).toBeTruthy();
    expect(queryByText(/no features yet/)).toBeNull();
    unmount();
  });
});

afterEach(() => {
  cleanup();
});

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AppShell session nav', () => {
  it('shows the logged-in user email and a Log out button when authenticated', () => {
    // Seed the session cache before render with staleTime: Infinity so
    // useSession never refetches (deterministic — no network).
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    client.setQueryData(sessionKeys.me, makeUser({ email: 'admin@example.com' }));

    const { getByText, queryByText, unmount } = render(() => (
      <Wrap client={client}>
        <span>page</span>
      </Wrap>
    ));

    expect(getByText('admin@example.com')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
    expect(queryByText('Log in')).toBeNull();
    expect(queryByText('Register')).toBeNull();
    unmount();
  });

  it('shows Login and Register links when unauthenticated', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    client.setQueryData(sessionKeys.me, null);

    const { getByText, queryByText, unmount } = render(() => (
      <Wrap client={client}>
        <span>page</span>
      </Wrap>
    ));

    expect(getByText('Log in')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(queryByText('Log out')).toBeNull();
    unmount();
  });
});
