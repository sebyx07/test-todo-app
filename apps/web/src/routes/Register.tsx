// Page: wires the register mutation to the presentational AuthForm. On success
// the store seeds the session cache; this page layers a redirect to /todos on top.
import { A, useNavigate } from '@solidjs/router';
import type { Component } from 'solid-js';
import { AuthForm } from '../components/AuthForm';
import { ApiError } from '../lib/api';
import { useRegister } from '../lib/auth';

const Register: Component = () => {
  const navigate = useNavigate();
  const register = useRegister();

  const handleSubmit = (email: string, password: string): void => {
    register.mutate({ email, password }, { onSuccess: () => navigate('/todos') });
  };

  // 409 = email already taken; anything else surfaces as a generic failure.
  const errorMessage = (): string | null => {
    const error = register.error;
    if (error instanceof ApiError && error.status === 409)
      return 'An account with that email already exists';
    return error ? 'Unable to register. Please try again.' : null;
  };

  return (
    <div class="auth-page">
      <AuthForm
        title="Register"
        submitLabel="Register"
        onSubmit={handleSubmit}
        pending={register.isPending}
        error={errorMessage()}
      />
      <p class="auth-page__alt">
        Already have an account? <A href="/login">Log in</A>
      </p>
    </div>
  );
};

export default Register;
