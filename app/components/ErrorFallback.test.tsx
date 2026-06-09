import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from './ErrorFallback';

afterEach(cleanup);

describe('ErrorFallback', () => {
  it('shows the recovery message and both actions', () => {
    render(<ErrorFallback onRetry={() => {}} onGoHome={() => {}} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.getByText('Back to today')).toBeTruthy();
  });

  it('fires onRetry and onGoHome when the buttons are pressed', () => {
    const onRetry = vi.fn();
    const onGoHome = vi.fn();
    render(<ErrorFallback onRetry={onRetry} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByText('Try again'));
    fireEvent.click(screen.getByText('Back to today'));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});
