// Presentational: one todo. Checkbox toggles completion, a delete button removes
// it, double-clicking the title enters an inline edit. All side effects are emitted
// as callbacks — the page wires them to the optimistic update/delete mutations.
import type { Todo } from '@todo/domain';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

export interface TodoItemProps {
  todo: Todo;
  /** Emit the new completion state for this todo. */
  onToggle: (id: string, completed: boolean) => void;
  /** Emit a delete request for this todo. */
  onDelete: (id: string) => void;
  /** Emit a renamed title for this todo (already trimmed + non-empty). */
  onRename: (id: string, title: string) => void;
}

export const TodoItem: Component<TodoItemProps> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal('');

  const toggle = (): void => props.onToggle(props.todo.id, !props.todo.completed);

  const startEdit = (): void => {
    setDraft(props.todo.title);
    setEditing(true);
  };

  const commit = (): void => {
    const value = draft().trim();
    if (value !== '' && value !== props.todo.title) {
      props.onRename(props.todo.id, value);
    }
    setEditing(false);
  };

  const cancel = (): void => {
    // Clear the draft so a trailing blur (fired by the browser as the focused
    // input is unmounted) cannot resurrect the discarded value via commit().
    setDraft('');
    setEditing(false);
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  return (
    <li class={`todo-item${props.todo.completed ? ' is-done' : ''}`}>
      <input
        class="todo-item__checkbox"
        type="checkbox"
        checked={props.todo.completed}
        onChange={toggle}
        aria-label={props.todo.completed ? 'Mark as not done' : 'Mark as done'}
      />
      {editing() ? (
        <input
          class="todo-item__edit"
          type="text"
          value={draft()}
          autofocus
          onInput={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          onKeyDown={onKey}
          aria-label="Edit todo title"
        />
      ) : (
        <button
          class="todo-item__title"
          type="button"
          onDblClick={startEdit}
          aria-label={`Rename todo: ${props.todo.title}`}
        >
          {props.todo.title}
        </button>
      )}
      <button
        class="btn todo-item__delete"
        type="button"
        onClick={() => props.onDelete(props.todo.id)}
        aria-label="Delete todo"
      >
        ✕
      </button>
    </li>
  );
};
