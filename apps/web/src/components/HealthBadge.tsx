// Live API status. Data via TanStack Query; rendering delegated to StatusDot.
import { useQuery } from '@tanstack/solid-query';
import type { Component } from 'solid-js';
import { apiGet } from '../lib/api';
import type { DotState } from './StatusDot';
import { StatusDot } from './StatusDot';

interface Health {
  ok: boolean;
}

export const HealthBadge: Component = () => {
  const health = useQuery(() => ({
    queryKey: ['health'],
    queryFn: () => apiGet<Health>('/healthz'),
  }));

  const state = (): DotState => {
    if (health.isPending) return 'pending';
    return health.data?.ok === true ? 'ok' : 'down';
  };

  const label = (): string =>
    ({ pending: 'checking api', ok: 'api up', down: 'api down' })[state()];

  return (
    <span class="badge">
      <StatusDot state={state()} label={label()} />
      {label()}
    </span>
  );
};
