// Admin user-management + stats client. Mirrors lib/todos.ts: centralized keys,
// reads via useQuery, mutations that patch/refresh the admin caches. All HTTP
// goes through lib/api (apiGet/apiPatch/apiDelete) — no fetch anywhere else.
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query';
import type { Role, User } from '@todo/domain';
import { apiDelete, apiGet, apiPatch } from './api';

/** Centralised, typo-safe query keys for the admin caches. */
export const adminKeys = {
  users: ['admin', 'users'] as const,
  stats: ['admin', 'stats'] as const,
};

/**
 * Aggregated platform counts returned by GET /admin/stats. Defined locally
 * because @todo/domain does not export a stats type (the shape originates in
 * the API service at apps/api/src/services/stats/list.ts).
 */
export interface PlatformStats {
  userCount: number;
  todoCount: number;
}

/** Typed wrappers around the /admin/* endpoints. All fetch stays in lib/api. */
export const adminApi = {
  /** List every user (admin-only). */
  listUsers(): Promise<User[]> {
    return apiGet<User[]>('/admin/users');
  },

  /** Change a user's role (admin-only). Returns the updated user. */
  updateUserRole(id: string, role: Role): Promise<User> {
    return apiPatch<User>(`/admin/users/${id}`, { role });
  },

  /** Delete a user (admin-only). 204 No Content. */
  deleteUser(id: string): Promise<void> {
    return apiDelete(`/admin/users/${id}`);
  },

  /** Fetch platform-wide counts (admin-only). */
  getStats(): Promise<PlatformStats> {
    return apiGet<PlatformStats>('/admin/stats');
  },
};

/** Variables for {@link useUpdateUserRole}: which user, and their new role. */
export interface UpdateUserRoleVariables {
  id: string;
  role: Role;
}

/**
 * Pure, deterministic optimistic-patch: returns a NEW list with the matched
 * user's role overlaid (non-mutating). Extracted so it is unit-testable in
 * isolation — the hooks themselves need a reactive root + QueryClient context.
 */
export function applyUserRolePatch(users: readonly User[], id: string, role: Role): User[] {
  return users.map((user): User => (user.id === id ? { ...user, role } : user));
}

/** Read the user list. Refetching/invalidation is driven by the mutations below. */
export function useUsers() {
  return useQuery(() => ({
    queryKey: adminKeys.users,
    queryFn: adminApi.listUsers,
  }));
}

/** Read platform stats. Invalidated when users are deleted or roles change. */
export function useAdminStats() {
  return useQuery(() => ({
    queryKey: adminKeys.stats,
    queryFn: adminApi.getStats,
  }));
}

/**
 * Change a user's role with an optimistic patch: snapshot the cache, apply the
 * new role immediately, roll back on error, then refetch both users and stats.
 * The stats refetch keeps the platform counts honest after a demotion/promotion.
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: ({ id, role }: UpdateUserRoleVariables) => adminApi.updateUserRole(id, role),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users });
      const previousUsers = queryClient.getQueryData<User[]>(adminKeys.users);
      if (previousUsers) {
        queryClient.setQueryData<User[]>(adminKeys.users, applyUserRolePatch(previousUsers, id, role));
      }
      return { previousUsers };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(adminKeys.users, context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  }));
}

/** Delete a user, then refresh the users + stats caches. */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation(() => ({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  }));
}
