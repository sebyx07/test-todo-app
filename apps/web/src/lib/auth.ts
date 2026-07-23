// Reactive session store. The session cookie is HttpOnly, so the client never
// reads it directly — `credentials: 'same-origin'` (in api.ts) carries it on every
// request, and the truth about "who am I?" comes from GET /auth/me via TanStack
// Query. Mutations here seed/refresh/invalidate that single query.
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query';
import type { CreateUserInput, Role, User } from '@todo/domain';
import { authApi } from './api';

/** Centralised, typo-safe query key for the current-user cache. */
export const sessionKeys = {
  me: ['session', 'me'] as const,
};

/** Null-safe admin predicate. Pure — unit-tested in isolation. */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

/** The current session: a reactive query for GET /auth/me (resolves to a User or errors). */
export function useSession() {
  // retry:false — a 401 (logged out) is a normal state, not a transient failure.
  return useQuery(() => ({
    queryKey: sessionKeys.me,
    queryFn: authApi.getMe,
    retry: false,
  }));
}

/** Register an account; on success seed the session cache so useSession updates immediately. */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (input: CreateUserInput) => authApi.register(input),
    onSuccess: (user: User) => {
      queryClient.setQueryData<User>(sessionKeys.me, user);
    },
  }));
}

/** Log in; on success seed the session cache so useSession updates immediately. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (input: CreateUserInput) => authApi.login(input),
    onSuccess: (user: User) => {
      queryClient.setQueryData<User>(sessionKeys.me, user);
    },
  }));
}

/** Log out; clear the session cache and refetch so useSession reflects the logout. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData<User | null>(sessionKeys.me, null);
      queryClient.invalidateQueries({ queryKey: sessionKeys.me });
    },
  }));
}

/**
 * Redirect guard for protected routes. Returns whether the route may render:
 * while the session is still loading it is allowed (show nothing); once resolved,
 * a missing user triggers a redirect to /login and the route is gated off. Pure
 * aside from the `navigate` side effect — the predicate logic is unit-tested.
 */
export function requireAuth(
  user: User | null | undefined,
  isLoading: boolean,
  navigate: (path: string) => void,
): boolean {
  if (isLoading) return true;
  if (!user) {
    navigate('/login');
    return false;
  }
  return true;
}

/** Role required for admin-only routes; mirrors {@link requireAuth} for non-admins. */
export function requireAdmin(
  user: User | null | undefined,
  isLoading: boolean,
  navigate: (path: string) => void,
): boolean {
  if (isLoading) return true;
  if (!isAdmin(user)) {
    navigate('/login');
    return false;
  }
  return true;
}

export type { CreateUserInput, Role, User };
