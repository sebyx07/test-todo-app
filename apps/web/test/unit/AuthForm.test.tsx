// Presentational component: props in (onSubmit, pending, error), events out. No
// hooks, no query client — verify user-facing behaviour only.
import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render } from '@solidjs/testing-library';
import { AuthForm } from '../../src/components/AuthForm';

describe('AuthForm', () => {
  it('calls onSubmit with the trimmed email and password on a valid submit', () => {
    const submit = mock();
    const { getByRole, getByLabelText, unmount } = render(() => (
      <AuthForm onSubmit={submit} submitLabel="Log in" title="Log in" />
    ));
    fireEvent.input(getByRole('textbox', { name: 'Email' }), {
      target: { value: '  user@example.com  ' },
    });
    fireEvent.input(getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(getByRole('button', { name: 'Log in' }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('user@example.com', 'password123');
    unmount();
  });

  it('does not call onSubmit when the fields are empty', () => {
    const submit = mock();
    const { getByRole, unmount } = render(() => (
      <AuthForm onSubmit={submit} submitLabel="Log in" title="Log in" />
    ));

    fireEvent.click(getByRole('button', { name: 'Log in' }));

    expect(submit).not.toHaveBeenCalled();
    unmount();
  });

  it('does not call onSubmit when the email is invalid', () => {
    const submit = mock();
    const { getByRole, getByLabelText, unmount } = render(() => (
      <AuthForm onSubmit={submit} submitLabel="Log in" title="Log in" />
    ));
    fireEvent.input(getByRole('textbox', { name: 'Email' }), {
      target: { value: 'not-an-email' },
    });
    fireEvent.input(getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(getByRole('button', { name: 'Log in' }));

    expect(submit).not.toHaveBeenCalled();
    unmount();
  });

  it('does not call onSubmit when the password is too short', () => {
    const submit = mock();
    const { getByRole, getByLabelText, unmount } = render(() => (
      <AuthForm onSubmit={submit} submitLabel="Log in" title="Log in" />
    ));
    fireEvent.input(getByRole('textbox', { name: 'Email' }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.input(getByLabelText('Password'), {
      target: { value: 'short' },
    });

    fireEvent.click(getByRole('button', { name: 'Log in' }));

    expect(submit).not.toHaveBeenCalled();
    unmount();
  });

  it('disables the submit button while pending', () => {
    const { getByRole, unmount } = render(() => (
      <AuthForm onSubmit={() => {}} submitLabel="Log in" title="Log in" pending />
    ));

    expect(getByRole('button', { name: 'Log in' }).hasAttribute('disabled')).toBe(true);
    unmount();
  });

  it('does not call onSubmit when pending', () => {
    const submit = mock();
    const { getByRole, getByLabelText, unmount } = render(() => (
      <AuthForm onSubmit={submit} submitLabel="Log in" title="Log in" pending />
    ));
    fireEvent.input(getByRole('textbox', { name: 'Email' }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.input(getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(getByRole('button', { name: 'Log in' }));

    expect(submit).not.toHaveBeenCalled();
    unmount();
  });

  it('displays the error message when provided', () => {
    const { getByText, unmount } = render(() => (
      <AuthForm
        onSubmit={() => {}}
        submitLabel="Log in"
        title="Log in"
        error="Invalid credentials"
      />
    ));

    expect(getByText('Invalid credentials')).toBeTruthy();
    unmount();
  });

  it('submits on Enter through the form', () => {
    const submit = mock();
    const { getByRole, getByLabelText, unmount } = render(() => (
      <AuthForm onSubmit={submit} submitLabel="Log in" title="Log in" />
    ));
    fireEvent.input(getByRole('textbox', { name: 'Email' }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.input(getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    const form = getByRole('textbox', { name: 'Email' }).closest('form');
    if (form) fireEvent.submit(form);

    expect(submit).toHaveBeenCalledWith('user@example.com', 'password123');
    unmount();
  });
});
