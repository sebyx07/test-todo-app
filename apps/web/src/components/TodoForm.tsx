// Presentational: controlled title input + submit. Emits the trimmed title; the
// page wires onSubmit to useCreateTodo. Disabled while empty or a create is pending.
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

export interface TodoFormProps {
  /** Called with the trimmed title on a non-empty submit. */
  onSubmit: (title: string) => void;
  /** When true (a create mutation is in flight) the submit button is disabled. */
  pending?: boolean;
}

export const TodoForm: Component<TodoFormProps> = (props) => {
  const [title, setTitle] = createSignal('');

  const submit = (event: SubmitEvent): void => {
    event.preventDefault();
    const value = title().trim();
    if (value === '' || props.pending) return;
    props.onSubmit(value);
    setTitle('');
  };

  return (
    <form class="todo-form" onSubmit={submit}>
      <input
        class="todo-form__input"
        type="text"
        placeholder="What needs to be done?"
        value={title()}
        onInput={(event) => setTitle(event.currentTarget.value)}
        aria-label="New todo title"
      />
      <button
        class="btn btn--primary todo-form__submit"
        type="submit"
        disabled={title().trim() === '' || props.pending}
      >
        Add
      </button>
    </form>
  );
};
