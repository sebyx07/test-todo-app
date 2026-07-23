// Presentational only: state → a colored dot. No data fetching here.
import type { Component } from 'solid-js';

export type DotState = 'ok' | 'down' | 'pending';

export const StatusDot: Component<{ state: DotState; label?: string }> = (props) => (
  <span
    class={`status-dot status-dot--${props.state}`}
    role="img"
    aria-label={props.label ?? props.state}
  />
);
