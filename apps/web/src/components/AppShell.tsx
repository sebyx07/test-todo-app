// Layout frame: header, routed content, footer. No page logic here.
import { A } from '@solidjs/router';
import type { ParentComponent } from 'solid-js';
import { HealthBadge } from './HealthBadge';
import { ThemeToggle } from './ThemeToggle';

export const AppShell: ParentComponent = (props) => (
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
