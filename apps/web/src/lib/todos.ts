// TanStack Query hooks for todo server state. Server state via Query only — never a hand-rolled cache.
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@todo/domain';
import { createSignal } from 'solid-js';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api';

/** Centralised, typo-safe query keys for the todos cache. */
export const todoKeys = {
  all: ['todos'] as const,
};

/** Variables for {@link useUpdateTodo}: which todo to patch, and how. */
export interface UpdateTodoVariables {
  id: string;
  input: UpdateTodoInput;
}

/**
 * Pure, deterministic optimistic-patch: returns a NEW list with the matched todo
 * overlaid by `patch` (non-mutating). Extracted so it is unit-testable in isolation
 * — the hooks themselves need a reactive root + QueryClient context.
 */
export function applyTodoPatch(todos: readonly Todo[], id: string, patch: UpdateTodoInput): Todo[] {
  return todos.map((todo): Todo => (todo.id === id ? { ...todo, ...patch } : todo));
}

// --- Client-side filtering ---------------------------------------------------

/** Visibility filter offered by the todo UI. */
export type TodoFilter = 'all' | 'active' | 'completed';

/** The ordered filter options the UI renders as buttons. */
export const TODO_FILTERS: readonly TodoFilter[] = ['all', 'active', 'completed'];

/** Reactive filter selection, default 'all'. Lives with the other todo primitives. */
export function useTodoFilter() {
  return createSignal<TodoFilter>('all');
}

/**
 * Pure filter: returns only the todos visible under the given filter.
 * Extracted so it is unit-testable without a reactive root.
 */
export function selectVisibleTodos(todos: readonly Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    case 'all':
      return [...todos];
  }
}

/** Counts for the stats line, derived from the full (unfiltered) list. */
export interface TodoCounts {
  total: number;
  active: number;
  done: number;
}

/**
 * Pure counter: total / active / done. Extracted so it is unit-testable without
 * a reactive root or the query cache.
 */
export function computeTodoCounts(todos: readonly Todo[]): TodoCounts {
  const done = todos.reduce((acc, todo) => acc + (todo.completed ? 1 : 0), 0);
  return { total: todos.length, active: todos.length - done, done };
}

/** Read the todo list. Refetching/invalidation is driven by the mutations below. */
export function useTodos() {
  return useQuery(() => ({
    queryKey: todoKeys.all,
    queryFn: fetchTodos,
  }));
}

/** Create a todo, then refresh the list cache. */
export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  }));
}

/**
 * Update a todo with an optimistic toggle: snapshot the cache, apply the patch
 * immediately, roll back on error, and refetch once settled.
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: ({ id, input }: UpdateTodoVariables) => updateTodo(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previousTodos = queryClient.getQueryData<Todo[]>(todoKeys.all);
      if (previousTodos) {
        queryClient.setQueryData<Todo[]>(todoKeys.all, applyTodoPatch(previousTodos, id, input));
      }
      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.all, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  }));
}

/** Delete a todo, then refresh the list cache. */
export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  }));
}
