// Page: composes the data hooks and wires them to the presentational components.
// useCreateTodo/useUpdateTodo/useDeleteTodo + the client-side filter live here,
// not inside the components. The visible list and counts are derived via memos.
import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';
import { TodoFilters } from '../components/TodoFilters';
import { TodoForm } from '../components/TodoForm';
import { TodoList } from '../components/TodoList';
import { TodoStats } from '../components/TodoStats';
import {
  computeTodoCounts,
  selectVisibleTodos,
  useCreateTodo,
  useDeleteTodo,
  useTodoFilter,
  useTodos,
  useUpdateTodo,
} from '../lib/todos';

const Todos: Component = () => {
  const todos = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const [filter, setFilter] = useTodoFilter();

  const handleCreate = (title: string): void => {
    createTodo.mutate({ title });
  };
  const handleToggle = (id: string, completed: boolean): void => {
    updateTodo.mutate({ id, input: { completed } });
  };
  const handleRename = (id: string, title: string): void => {
    updateTodo.mutate({ id, input: { title } });
  };
  const handleDelete = (id: string): void => {
    deleteTodo.mutate(id);
  };

  // Derive the visible list from the filter; counts always come from the full set
  // so the stats line reflects reality regardless of the active filter.
  const all = createMemo(() => todos.data ?? []);
  const visible = createMemo(() => selectVisibleTodos(all(), filter()));
  const counts = createMemo(() => computeTodoCounts(all()));

  return (
    <section class="todo-page">
      <h1 class="todo-page__title">Todos</h1>
      <TodoForm onSubmit={handleCreate} pending={createTodo.isPending} />
      <TodoFilters current={filter()} onChange={setFilter} />
      <TodoStats counts={counts()} />
      <TodoList
        todos={visible()}
        total={all().length}
        isLoading={todos.isLoading}
        error={todos.error}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onRename={handleRename}
      />
    </section>
  );
};

export default Todos;
