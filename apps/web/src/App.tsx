// Root wiring only: providers + router. Nothing else belongs here.
import { Route, Router } from '@solidjs/router';
import { QueryClientProvider } from '@tanstack/solid-query';
import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { AppShell } from './components/AppShell';
import { queryClient } from './lib/query';
import { ROUTE_TABLE } from './lib/routes';

export const App: Component = () => (
  <QueryClientProvider client={queryClient}>
    <Router root={AppShell}>
      <For each={ROUTE_TABLE}>
        {(entry) => <Route path={entry.path} component={entry.component} />}
      </For>
    </Router>
  </QueryClientProvider>
);
