// Presentational component: props in (todo + callbacks), events out. Verify
// checkbox toggle, delete, inline edit (double-click + Enter/Escape/blur), and
// the is-done visual state. No query client is involved.
import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render } from '@solidjs/testing-library';
import type { Todo } from '@todo/domain';
import { TodoItem } from '../../src/components/TodoItem';

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    title: 'Write tests',
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function noop(): void {}

describe('TodoItem', () => {
  it('renders the title and an unchecked checkbox', () => {
    const { getByLabelText, getByText, unmount } = render(() => (
      <TodoItem todo={makeTodo()} onToggle={noop} onDelete={noop} onRename={noop} />
    ));

    expect(getByText('Write tests')).toBeTruthy();
    expect((getByLabelText('Mark as done') as HTMLInputElement).checked).toBe(false);
    unmount();
  });

  it('toggles completion via the checkbox', () => {
    const onToggle = mock();
    const { getByLabelText, unmount } = render(() => (
      <TodoItem todo={makeTodo()} onToggle={onToggle} onDelete={noop} onRename={noop} />
    ));

    fireEvent.change(getByLabelText('Mark as done'));

    expect(onToggle).toHaveBeenCalledWith('todo-1', true);
    unmount();
  });

  it('emits the inverted completed flag for a completed todo', () => {
    const onToggle = mock();
    const { getByLabelText, unmount } = render(() => (
      <TodoItem
        todo={makeTodo({ completed: true })}
        onToggle={onToggle}
        onDelete={noop}
        onRename={noop}
      />
    ));

    fireEvent.change(getByLabelText('Mark as not done'));

    expect(onToggle).toHaveBeenCalledWith('todo-1', false);
    unmount();
  });

  it('removes the todo via the delete button', () => {
    const onDelete = mock();
    const { getByLabelText, unmount } = render(() => (
      <TodoItem todo={makeTodo()} onToggle={noop} onDelete={onDelete} onRename={noop} />
    ));

    fireEvent.click(getByLabelText('Delete todo'));

    expect(onDelete).toHaveBeenCalledWith('todo-1');
    unmount();
  });

  it('marks the row with is-done when completed', () => {
    const { container, unmount } = render(() => (
      <TodoItem
        todo={makeTodo({ completed: true })}
        onToggle={noop}
        onDelete={noop}
        onRename={noop}
      />
    ));

    expect(container.querySelector('.todo-item')?.classList.contains('is-done')).toBe(true);
    unmount();
  });

  it('enters edit mode on double-click and renames on Enter', () => {
    const onRename = mock();
    const { getByText, getByLabelText, unmount } = render(() => (
      <TodoItem todo={makeTodo()} onToggle={noop} onDelete={noop} onRename={onRename} />
    ));

    fireEvent.dblClick(getByText('Write tests'));
    const edit = getByLabelText('Edit todo title') as HTMLInputElement;
    fireEvent.input(edit, { target: { value: 'Write more tests' } });
    fireEvent.keyDown(edit, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('todo-1', 'Write more tests');
    unmount();
  });

  it('cancels editing on Escape without renaming', () => {
    const onRename = mock();
    const { getByText, getByLabelText, unmount } = render(() => (
      <TodoItem todo={makeTodo()} onToggle={noop} onDelete={noop} onRename={onRename} />
    ));

    fireEvent.dblClick(getByText('Write tests'));
    const edit = getByLabelText('Edit todo title') as HTMLInputElement;
    fireEvent.input(edit, { target: { value: 'Discarded' } });
    fireEvent.keyDown(edit, { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    // editing exited — the edit input is gone, the title text returns
    expect(() => getByLabelText('Edit todo title')).toThrow();
    unmount();
  });

  it('ignores an empty edit on blur without renaming', () => {
    const onRename = mock();
    const { getByText, getByLabelText, unmount } = render(() => (
      <TodoItem todo={makeTodo()} onToggle={noop} onDelete={noop} onRename={onRename} />
    ));

    fireEvent.dblClick(getByText('Write tests'));
    const edit = getByLabelText('Edit todo title') as HTMLInputElement;
    fireEvent.input(edit, { target: { value: '   ' } });
    fireEvent.blur(edit);

    expect(onRename).not.toHaveBeenCalled();
    unmount();
  });
});
