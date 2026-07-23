// Page: composes the data hooks and wires them to the presentational components.
// useCreateTodo/useUpdateTodo/useDeleteTodo live here, not inside the components.
import type { Component } from 'solid-js';
import { TodoForm } from '../components/TodoForm';
import { TodoList } from '../components/TodoList';
import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from '../lib/todos';

const Todos: Component = () => {
  const todos = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

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

  return (
    <section class="todo-page">
      <h1 class="todo-page__title">Todos</h1>
      <TodoForm onSubmit={handleCreate} pending={createTodo.isPending} />
      <TodoList
        todos={todos.data ?? []}
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
