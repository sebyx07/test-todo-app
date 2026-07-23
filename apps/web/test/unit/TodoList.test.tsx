// Presentational component: receives query state (todos, isLoading, error) as
// props and renders loading / error / empty / populated branches. Verifies the
// For-driven list and that child callbacks are forwarded.
import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render } from '@solidjs/testing-library';
import type { Todo } from '@todo/domain';
import { TodoList } from '../../src/components/TodoList';

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

const handlers = {
  onToggle: () => {},
  onDelete: () => {},
  onRename: () => {},
};

describe('TodoList', () => {
  it('renders a loading message while loading', () => {
    const { getByText, queryByRole, unmount } = render(() => (
      <TodoList todos={[]} isLoading error={undefined} {...handlers} />
    ));

    expect(getByText('Loading todos…')).toBeTruthy();
    expect(queryByRole('listitem')).toBeNull();
    unmount();
  });

  it('renders the error message when the query failed', () => {
    const { getByText, unmount } = render(() => (
      <TodoList todos={[]} isLoading={false} error={new Error('network down')} {...handlers} />
    ));

    expect(getByText('network down')).toBeTruthy();
    unmount();
  });

  it('falls back to a generic message for a non-Error error', () => {
    const { getByText, unmount } = render(() => (
      <TodoList todos={[]} isLoading={false} error="boom" {...handlers} />
    ));

    expect(getByText('Failed to load todos')).toBeTruthy();
    unmount();
  });

  it('renders an empty-state message when there are no todos', () => {
    const { getByText, queryByRole, unmount } = render(() => (
      <TodoList todos={[]} isLoading={false} error={undefined} {...handlers} />
    ));

    expect(getByText(/add your first todo/i)).toBeTruthy();
    expect(queryByRole('listitem')).toBeNull();
    unmount();
  });

  it('renders one item per todo via For', () => {
    const todos = [
      makeTodo({ id: '1', title: 'A' }),
      makeTodo({ id: '2', title: 'B', completed: true }),
    ];
    const { getAllByRole, getByText, unmount } = render(() => (
      <TodoList todos={todos} isLoading={false} error={undefined} {...handlers} />
    ));

    expect(getAllByRole('listitem')).toHaveLength(2);
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    unmount();
  });

  it('forwards the child callbacks through to each item', () => {
    const onToggle = mock();
    const onDelete = mock();
    const onRename = mock();
    const { getByLabelText, unmount } = render(() => (
      <TodoList
        todos={[makeTodo({ id: '9', completed: false })]}
        isLoading={false}
        error={undefined}
        onToggle={onToggle}
        onDelete={onDelete}
        onRename={onRename}
      />
    ));

    fireEvent.change(getByLabelText('Mark as done'));
    expect(onToggle).toHaveBeenCalledWith('9', true);

    fireEvent.click(getByLabelText('Delete todo'));
    expect(onDelete).toHaveBeenCalledWith('9');
    unmount();
  });
});
