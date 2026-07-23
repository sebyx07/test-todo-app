// `/` is the todos experience — redirect to the canonical route, which owns the
// data hooks (routes/Todos.tsx). A client-side redirect keeps a single source of
// truth for the wiring and makes the brand/nav links land on the app.
import { Navigate } from '@solidjs/router';
import type { Component } from 'solid-js';

const Home: Component = () => <Navigate href="/todos" />;

export default Home;
