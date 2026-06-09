import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClayButton } from './ClayButton';

afterEach(cleanup);

describe('ClayButton', () => {
  it('renders the label and fires onPress when not loading', () => {
    const onPress = vi.fn();
    render(<ClayButton label="Save changes" onPress={onPress} />);
    fireEvent.click(screen.getByText('Save changes'));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('hides the label and does not fire onPress while loading', () => {
    const onPress = vi.fn();
    render(<ClayButton label="Save changes" loading onPress={onPress} />);
    expect(screen.queryByText('Save changes')).toBeNull();
    // The accessible button is still present (label preserved for screen readers).
    const button = screen.getByRole('button', { name: 'Save changes' });
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
