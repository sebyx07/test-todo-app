import { A } from '@solidjs/router';
import type { Component } from 'solid-js';

const NotFound: Component = () => (
  <section class="hero">
    <h1 class="hero__title">404</h1>
    <p class="hero__lead">
      No route here. <A href="/">Back home</A>.
    </p>
  </section>
);

export default NotFound;
