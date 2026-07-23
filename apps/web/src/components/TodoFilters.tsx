// Presentational: the All/Active/Completed filter row. `current` is controlled
// by the route (useTodoFilter); clicking a button emits the chosen filter.
import type { Component } from 'solid-js';
import { For } from 'solid-js';
import type { TodoFilter } from '../lib/todos';
import { TODO_FILTERS } from '../lib/todos';

export interface TodoFiltersProps {
  /** The currently selected filter. */
  current: TodoFilter;
  /** Emit the newly selected filter. */
  onChange: (filter: TodoFilter) => void;
}

const LABELS: Readonly<Record<TodoFilter, string>> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
};

export const TodoFilters: Component<TodoFiltersProps> = (props) => (
  <fieldset class="todo-filters" aria-label="Filter todos">
    <For each={TODO_FILTERS}>
      {(filter) => (
        <button
          class={`btn todo-filters__btn${props.current === filter ? ' is-active' : ''}`}
          type="button"
          aria-pressed={props.current === filter}
          onClick={() => props.onChange(filter)}
        >
          {LABELS[filter]}
        </button>
      )}
    </For>
  </fieldset>
);
