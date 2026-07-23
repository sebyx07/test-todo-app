// Layout frame: header, routed content, footer. The header is session-aware:
// it reads useSession to show the current user's email + a Logout button when
// authenticated, and Log in / Register links when not.
import { A } from '@solidjs/router';
import type { ParentComponent } from 'solid-js';
import { Show } from 'solid-js';
import { isAdmin, useLogout, useSession } from '../lib/auth';
import { HealthBadge } from './HealthBadge';
import { ThemeToggle } from './ThemeToggle';

export const AppShell: ParentComponent = (props) => {
  const session = useSession();
  const logout = useLogout();
  const user = () => session.data;

  return (
    <>
      <header class="site-header">
        <div class="container site-header__inner">
          <A href="/" class="site-header__brand">
            ✅ todo
          </A>
          <nav class="site-header__nav">
            <A href="/todos" class="site-header__link">
              Todos
            </A>
            <Show when={isAdmin(user())}>
              <A href="/admin" class="site-header__link">
                Admin
              </A>
            </Show>
            <Show
              when={user()}
              fallback={
                <>
                  <A href="/login" class="site-header__link">
                    Log in
                  </A>
                  <A href="/register" class="site-header__link">
                    Register
                  </A>
                </>
              }
            >
              {(currentUser) => (
                <>
                  <span class="site-header__user">{currentUser().email}</span>
                  <button
                    type="button"
                    class="btn site-header__logout"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                  >
                    Log out
                  </button>
                </>
              )}
            </Show>
            <HealthBadge />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main class="site-main">
        <div class="container">{props.children}</div>
      </main>

      <footer class="site-footer">
        <div class="container">todo</div>
      </footer>
    </>
  );
};
