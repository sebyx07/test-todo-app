// Regression test for the AppShell footer copy. The footer used to read
// "scaffold — no features yet" once the todo feature shipped that text became
// stale, so this asserts the current copy and guards against the old wording.

import { afterEach, describe, expect, it } from 'bun:test';
import { Route, Router } from '@solidjs/router';
import { cleanup, render } from '@solidjs/testing-library';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import type { ParentComponent } from 'solid-js';
import { AppShell } from '../../src/components/AppShell';

const Wrap: ParentComponent = (props) => {
  // Fresh client per render so HealthBadge's query never leaks between tests.
  // AppShell renders <A> links, which require a Route context — mount it as a
  // layout route so the brand/nav anchors resolve.
  const client = new QueryClient();
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
