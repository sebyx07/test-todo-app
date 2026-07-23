// Page: the admin panel. Gates access via requireAdmin (non-admins redirect to
// /login), then consumes the admin hooks — useUsers, useUpdateUserRole,
// useDeleteUser, useAdminStats — to render the platform counts and a user list
// with per-row role-toggle and delete actions. The mutations' onError surfaces
// a user-facing message; the optimistic patches keep the list responsive.

import { useNavigate } from '@solidjs/router';
import type { Role, User } from '@todo/domain';
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { useAdminStats, useDeleteUser, useUpdateUserRole, useUsers } from '../lib/admin';
import { ApiError } from '../lib/api';
import { requireAdmin, useSession } from '../lib/auth';

/** Toggle a user between the two roles. The server enforces self/last-admin guards. */
const nextRole = (role: Role): Role => (role === 'admin' ? 'user' : 'admin');

/**
 * Map a mutation error to a short, actionable message. The API throws
 * ForbiddenError (403) for self-modification and last-admin demotion, and
 * NotFoundError (404) when the target was removed between render and action.
 */
const actionError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Action not allowed';
    if (error.status === 404) return 'That user no longer exists';
  }
  return 'Something went wrong. Please try again.';
};

const Admin: Component = () => {
  const navigate = useNavigate();
  const session = useSession();
  const users = useUsers();
  const stats = useAdminStats();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  // requireAdmin returns true while loading (render nothing) or when the session
  // is an admin; otherwise it redirects to /login and returns false.
  if (!requireAdmin(session.data, session.isLoading, navigate)) return null;

  const handleRole = (user: User): void => {
    updateRole.mutate({ id: user.id, role: nextRole(user.role) });
  };
  const handleDelete = (id: string): void => {
    deleteUser.mutate(id);
  };

  const counts = (): { userCount: number; todoCount: number } =>
    stats.data ?? { userCount: 0, todoCount: 0 };

  return (
    <section class="admin-page">
      <h1 class="admin-page__title">Admin</h1>

      <p class="admin-page__stats" role="status">
        <span class="admin-page__count">{counts().userCount}</span> users
        <span class="admin-page__sep" aria-hidden="true">
          ·
        </span>
        <span class="admin-page__count">{counts().todoCount}</span> todos
      </p>

      <Show when={updateRole.error || deleteUser.error}>
        <p class="admin-page__error">{actionError(updateRole.error ?? deleteUser.error)}</p>
      </Show>

      <Show when={users.isLoading}>
        <p class="admin-page__loading">Loading users…</p>
      </Show>
      <Show when={users.error}>
        <p class="admin-page__error">Failed to load users</p>
      </Show>

      <Show when={!users.isLoading && !users.error}>
        <table class="admin-table">
          <thead>
            <tr>
              <th class="admin-table__th" scope="col">
                Email
              </th>
              <th class="admin-table__th" scope="col">
                Role
              </th>
              <th class="admin-table__th admin-table__th--action" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={users.data ?? []}>
              {(user) => (
                <tr class="admin-table__row">
                  <th class="admin-table__td admin-table__td--email" scope="row">
                    {user.email}
                  </th>
                  <td class="admin-table__td">
                    <button
                      class="admin-table__role"
                      type="button"
                      onClick={() => handleRole(user)}
                      disabled={updateRole.isPending || deleteUser.isPending}
                    >
                      {user.role}
                    </button>
                  </td>
                  <td class="admin-table__td admin-table__td--action">
                    <button
                      class="btn admin-table__delete"
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      disabled={updateRole.isPending || deleteUser.isPending}
                      aria-label={`Delete ${user.email}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </section>
  );
};

export default Admin;
