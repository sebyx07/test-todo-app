// Component behavior test for the All/Active/Completed filter row. No data hooks
// here — TodoFilters is purely presentational, so we render it directly and assert
// the user-facing contract: all three labels render, the current one is pressed,
// and clicking another emits the selection.

import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, render } from '@solidjs/testing-library';
import { TodoFilters } from '../../src/components/TodoFilters';

afterEach(() => {
  cleanup();
});

describe('TodoFilters', () => {
  it('renders an All, Active and Completed button in order', () => {
    const { getByRole } = render(() => <TodoFilters current="all" onChange={() => {}} />);

    const group = getByRole('group');
    const buttons = group.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.textContent).toBe('All');
    expect(buttons[1]?.textContent).toBe('Active');
    expect(buttons[2]?.textContent).toBe('Completed');
  });

  it('marks only the current filter as pressed', () => {
    const { getByRole } = render(() => <TodoFilters current="active" onChange={() => {}} />);

    const activeBtn = getByRole('button', { name: 'Active' });
    const allBtn = getByRole('button', { name: 'All' });
    const doneBtn = getByRole('button', { name: 'Completed' });

    expect(activeBtn.getAttribute('aria-pressed')).toBe('true');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
    expect(doneBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('emits the clicked filter via onChange', () => {
    let selected: string | undefined;
    const { getByRole } = render(() => (
      <TodoFilters current="all" onChange={(filter) => (selected = filter)} />
    ));

    getByRole('button', { name: 'Completed' }).click();

    expect(selected).toBe('completed');
  });
});
