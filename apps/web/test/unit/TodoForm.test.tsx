// Presentational component: props in (onSubmit, pending), events out. No hooks,
// no query client — verify user-facing behaviour only.
import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render } from '@solidjs/testing-library';
import { TodoForm } from '../../src/components/TodoForm';

describe('TodoForm', () => {
  it('disables the submit button while the input is empty', () => {
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={() => {}} />);

    expect(getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(true);
    unmount();
  });

  it('disables the submit button when the input is only whitespace', () => {
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={() => {}} />);
    fireEvent.input(getByRole('textbox', { name: 'New todo title' }), {
      target: { value: '   ' },
    });

    expect(getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(true);
    unmount();
  });

  it('calls onSubmit with the trimmed value and clears the field', () => {
    const submit = mock();
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={submit} />);
    const input = getByRole('textbox', { name: 'New todo title' });
    fireEvent.input(input, { target: { value: '  Buy milk  ' } });

    fireEvent.click(getByRole('button', { name: 'Add' }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith('Buy milk');
    expect((input as HTMLInputElement).value).toBe('');
    unmount();
  });

  it('enables the submit button once non-empty text is entered', () => {
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={() => {}} />);
    fireEvent.input(getByRole('textbox', { name: 'New todo title' }), {
      target: { value: 'Write tests' },
    });

    expect(getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(false);
    unmount();
  });

  it('disables the submit button while pending', () => {
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={() => {}} pending />);
    fireEvent.input(getByRole('textbox', { name: 'New todo title' }), {
      target: { value: 'Write tests' },
    });

    expect(getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(true);
    unmount();
  });

  it('does not call onSubmit when pending', () => {
    const submit = mock();
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={submit} pending />);
    fireEvent.input(getByRole('textbox', { name: 'New todo title' }), {
      target: { value: 'Write tests' },
    });

    fireEvent.click(getByRole('button', { name: 'Add' }));

    expect(submit).not.toHaveBeenCalled();
    unmount();
  });

  it('submits on Enter through the form', () => {
    const submit = mock();
    const { getByRole, unmount } = render(() => <TodoForm onSubmit={submit} />);
    fireEvent.input(getByRole('textbox', { name: 'New todo title' }), {
      target: { value: 'Walk dog' },
    });

    const form = getByRole('textbox', { name: 'New todo title' }).closest('form');
    if (form) fireEvent.submit(form);

    expect(submit).toHaveBeenCalledWith('Walk dog');
    unmount();
  });
});
