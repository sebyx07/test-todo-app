// Lazy route table — one entry per route file, keeps the initial bundle small.

import type { Component } from 'solid-js';
import { lazy } from 'solid-js';

export interface RouteEntry {
  path: string;
  component: Component;
}

export const ROUTE_TABLE: RouteEntry[] = [
  { path: '/', component: lazy(() => import('../routes/Home')) },
  { path: '*', component: lazy(() => import('../routes/NotFound')) },
];
