// One job: every HTTP call to the API goes through here. No fetch() elsewhere.
import type { CreateTodoInput, CreateUserInput, Todo, UpdateTodoInput, User } from '@todo/domain';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL: string = import.meta.env['VITE_API_URL'] ?? '/api';

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { accept: 'application/json' },
    credentials: 'same-origin',
    ...init,
  });

  if (!response.ok) throw new ApiError(response.status, `GET ${path} failed`);

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  if (!response.ok) throw new ApiError(response.status, `POST ${path} failed`);

  return (await response.json()) as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  if (!response.ok) throw new ApiError(response.status, `PATCH ${path} failed`);

  return (await response.json()) as T;
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) throw new ApiError(response.status, `DELETE ${path} failed`);
}

export function fetchTodos(): Promise<Todo[]> {
  return apiGet<Todo[]>('/todos');
}

export function createTodo(input: CreateTodoInput): Promise<Todo> {
  return apiPost<Todo>('/todos', input);
}

export function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  return apiPatch<Todo>(`/todos/${id}`, input);
}

export function deleteTodo(id: string): Promise<void> {
  return apiDelete(`/todos/${id}`);
}

// --- Auth surface -----------------------------------------------------------
// The session cookie is HttpOnly, so the client never reads it — it only needs to
// be SENT, which `credentials: 'same-origin'` above guarantees for every call.

/** Typed wrappers around the /auth/* endpoints. All fetch stays in this file. */
export const authApi = {
  /** Register a new account; the server sets the session cookie. Returns the new user. */
  register(input: CreateUserInput): Promise<User> {
    return apiPost<User>('/auth/register', input);
  },

  /** Log in with email + password; the server sets the session cookie. Returns the user. */
  login(input: CreateUserInput): Promise<User> {
    return apiPost<User>('/auth/login', input);
  },

  /** Log out; the server clears the session cookie and responds 204 with no body. */
  async logout(): Promise<void> {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'same-origin',
    });

    if (!response.ok) throw new ApiError(response.status, 'POST /auth/logout failed');
  },

  /** Fetch the currently authenticated user (throws ApiError 401 when logged out). */
  getMe(): Promise<User> {
    return apiGet<User>('/auth/me');
  },
};
