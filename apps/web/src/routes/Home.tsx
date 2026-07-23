// Placeholder landing page — replaced by the first real feature.
import type { Component } from 'solid-js';

const STACK: ReadonlyArray<readonly [string, string]> = [
  ['runtime', 'bun 1.3'],
  ['api', 'hono + zod'],
  ['web', 'solid + vite'],
  ['styles', 'scss tokens'],
  ['tests', 'bun:test'],
];

const Home: Component = () => (
  <>
    <section class="hero">
      <h1 class="hero__title">Base is ready</h1>
      <p class="hero__lead">
        Bun monorepo scaffold — API, web shell, tokens, tests, CI. No product code yet. Start with{' '}
        <code>/initial-idea</code>, then <code>/planx</code>, then <code>/feature</code>.
      </p>
    </section>

    <div class="card-grid">
      <article class="card">
        <h2 class="card__title">Stack</h2>
        <dl class="kv">
          {STACK.map(([key, value]) => (
            <div class="kv__row">
              <dt class="kv__key">{key}</dt>
              <dd class="kv__value">{value}</dd>
            </div>
          ))}
        </dl>
      </article>

      <article class="card">
        <h2 class="card__title">Commands</h2>
        <dl class="kv">
          <div class="kv__row">
            <dt class="kv__key">boot</dt>
            <dd class="kv__value">bin/dev</dd>
          </div>
          <div class="kv__row">
            <dt class="kv__key">gate</dt>
            <dd class="kv__value">bin/check</dd>
          </div>
          <div class="kv__row">
            <dt class="kv__key">scripts</dt>
            <dd class="kv__value">bun run help</dd>
          </div>
        </dl>
      </article>
    </div>
  </>
);

export default Home;
