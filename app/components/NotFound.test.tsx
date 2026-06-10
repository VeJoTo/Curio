import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFound } from './NotFound';

afterEach(cleanup);

describe('NotFound', () => {
  it('shows the default message and a way back to today', () => {
    render(<NotFound onGoHome={() => {}} />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Back to today')).toBeTruthy();
  });

  it('renders a custom message when provided', () => {
    render(<NotFound message="We couldn't find that topic." onGoHome={() => {}} />);
    expect(screen.getByText("We couldn't find that topic.")).toBeTruthy();
  });

  it('fires onGoHome when the button is pressed', () => {
    const onGoHome = vi.fn();
    render(<NotFound onGoHome={onGoHome} />);
    fireEvent.click(screen.getByText('Back to today'));
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});
