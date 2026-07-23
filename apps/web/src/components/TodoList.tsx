// Presentational: renders the todo collection with explicit loading, error and
// empty branches. The query state arrives as props — the page owns the hooks.
import type { Todo } from '@todo/domain';
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { TodoItem } from './TodoItem';

export interface TodoListProps {
  todos: readonly Todo[];
  isLoading: boolean;
  error?: unknown;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Failed to load todos';

export const TodoList: Component<TodoListProps> = (props) => (
  <section class="todo-list" aria-label="Todos">
    <Show when={props.isLoading}>
      <p class="todo-list__loading">Loading todos…</p>
    </Show>
    <Show when={props.error}>
      <p class="todo-list__error">{errorMessage(props.error)}</p>
    </Show>
    <Show when={!props.isLoading && !props.error && props.todos.length === 0}>
      <p class="todo-list__empty">Nothing to do yet — add your first todo above.</p>
    </Show>
    <Show when={!props.isLoading && !props.error && props.todos.length > 0}>
      <ul class="todo-list__items">
        <For each={props.todos}>
          {(todo) => (
            <TodoItem
              todo={todo}
              onToggle={props.onToggle}
              onDelete={props.onDelete}
              onRename={props.onRename}
            />
          )}
        </For>
      </ul>
    </Show>
  </section>
);
