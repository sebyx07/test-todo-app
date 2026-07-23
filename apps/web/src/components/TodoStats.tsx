// Presentational: a total/active/done counts line. The counts are computed by
// the route from the full (unfiltered) query data and arrive as a prop.
import type { Component } from 'solid-js';
import type { TodoCounts } from '../lib/todos';

export interface TodoStatsProps {
  /** Pre-computed total / active / done counts. */
  counts: TodoCounts;
}

const statsLabel = (counts: TodoCounts): string =>
  `todo stats: ${counts.total} total, ${counts.active} active, ${counts.done} done`;

export const TodoStats: Component<TodoStatsProps> = (props) => (
  <div class="todo-stats" role="status" aria-label={statsLabel(props.counts)}>
    <span class="todo-stats__count">{props.counts.total}</span>
    <span class="todo-stats__label">total</span>
    <span class="todo-stats__sep" aria-hidden="true">
      ·
    </span>
    <span class="todo-stats__count">{props.counts.active}</span>
    <span class="todo-stats__label">active</span>
    <span class="todo-stats__sep" aria-hidden="true">
      ·
    </span>
    <span class="todo-stats__count">{props.counts.done}</span>
    <span class="todo-stats__label">done</span>
  </div>
);
