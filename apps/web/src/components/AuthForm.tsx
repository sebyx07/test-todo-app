// Presentational auth form: email + password inputs in, validated submit out.
// No hooks beyond local signals, no query client — the page owns the mutation
// and passes pending/error state down. Validation is native (no Zod in web):
// email regex + 8-char password minimum mirror the API's CreateUserInput rules.
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

export interface AuthFormProps {
  /** Called with the trimmed email and password on a valid submit. */
  onSubmit: (email: string, password: string) => void;
  /** When true (a mutation is in flight) inputs/button are disabled. */
  pending?: boolean;
  /** Server error to surface under the form (e.g. bad credentials, 409). */
  error?: string | null;
  /** Submit button label, e.g. "Log in" or "Register". */
  submitLabel: string;
  /** Form heading, e.g. "Log in" or "Create your account". */
  title: string;
}

export const AuthForm: Component<AuthFormProps> = (props) => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [touched, setTouched] = createSignal(false);

  const emailValid = () => EMAIL_RE.test(email().trim());
  const passwordValid = () => password().length >= PASSWORD_MIN;
  const formValid = () => emailValid() && passwordValid();

  const submit = (event: SubmitEvent): void => {
    event.preventDefault();
    setTouched(true);
    if (!formValid() || props.pending) return;
    props.onSubmit(email().trim(), password());
  };

  const emailError = () =>
    touched() && email() !== '' && !emailValid() ? 'Enter a valid email address' : null;
  const passwordError = () =>
    touched() && password() !== '' && !passwordValid()
      ? `Password must be at least ${PASSWORD_MIN} characters`
      : null;

  return (
    <form class="auth-form" onSubmit={submit} novalidate>
      <h1 class="auth-form__title">{props.title}</h1>

      <label class="auth-form__field">
        <span class="auth-form__label">Email</span>
        <input
          class="auth-form__input"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          value={email()}
          onInput={(event) => setEmail(event.currentTarget.value)}
          onBlur={() => setTouched(true)}
          aria-label="Email"
          aria-invalid={emailError() !== null}
          disabled={props.pending}
        />
      </label>
      <Show when={emailError()} keyed={false}>
        {(msg) => <p class="auth-form__error">{msg()}</p>}
      </Show>

      <label class="auth-form__field">
        <span class="auth-form__label">Password</span>
        <input
          class="auth-form__input"
          type="password"
          autocomplete="current-password"
          placeholder="At least 8 characters"
          value={password()}
          onInput={(event) => setPassword(event.currentTarget.value)}
          onBlur={() => setTouched(true)}
          aria-label="Password"
          aria-invalid={passwordError() !== null}
          disabled={props.pending}
        />
      </label>
      <Show when={passwordError()} keyed={false}>
        {(msg) => <p class="auth-form__error">{msg()}</p>}
      </Show>

      <Show when={props.error}>
        {(serverError) => <p class="auth-form__error auth-form__error--server">{serverError()}</p>}
      </Show>

      <button class="btn btn--primary auth-form__submit" type="submit" disabled={props.pending}>
        {props.submitLabel}
      </button>
    </form>
  );
};
