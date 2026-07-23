import { describe, expect, it } from 'bun:test';
import { render } from '@solidjs/testing-library';
import { StatusDot } from '../../src/components/StatusDot';

describe('StatusDot', () => {
  it('renders the state as a modifier class', () => {
    const { getByRole, unmount } = render(() => <StatusDot state="ok" />);

    expect(getByRole('img').className).toBe('status-dot status-dot--ok');
    unmount();
  });

  it('uses the label as the accessible name', () => {
    const { getByLabelText, unmount } = render(() => <StatusDot state="down" label="api down" />);

    expect(getByLabelText('api down')).toBeTruthy();
    unmount();
  });
});
