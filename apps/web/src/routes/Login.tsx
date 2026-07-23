// Page: wires the login mutation to the presentational AuthForm. On success the
// store seeds the session cache; this page layers a redirect to /todos on top.
import { A, useNavigate } from '@solidjs/router';
import type { Component } from 'solid-js';
import { AuthForm } from '../components/AuthForm';
import { ApiError } from '../lib/api';
import { useLogin } from '../lib/auth';

const Login: Component = () => {
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = (email: string, password: string): void => {
    login.mutate({ email, password }, { onSuccess: () => navigate('/todos') });
  };

  // 401 = bad credentials; anything else surfaces as a generic failure.
  const errorMessage = (): string | null => {
    const error = login.error;
    if (error instanceof ApiError && error.status === 401) return 'Invalid email or password';
    return error ? 'Unable to log in. Please try again.' : null;
  };

  return (
    <div class="auth-page">
      <AuthForm
        title="Log in"
        submitLabel="Log in"
        onSubmit={handleSubmit}
        pending={login.isPending}
        error={errorMessage()}
      />
      <p class="auth-page__alt">
        Need an account? <A href="/register">Register</A>
      </p>
    </div>
  );
};

export default Login;
