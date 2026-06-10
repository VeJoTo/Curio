import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeStep } from './TimeStep';

afterEach(cleanup);

describe('TimeStep', () => {
  it('picking a time preset updates the draft but does not auto-advance', () => {
    const patch = vi.fn();
    const next = vi.fn();
    render(<TimeStep draft={{ interests: [] }} patch={patch} next={next} finish={vi.fn()} />);
    fireEvent.click(screen.getByText('🌅 Morning · 8:00'));
    expect(patch).toHaveBeenCalledWith({ dailyTime: '08:00' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Next is disabled until a time is picked, then advances', () => {
    const next = vi.fn();
    const { rerender } = render(
      <TimeStep draft={{ interests: [] }} patch={vi.fn()} next={next} finish={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('Next →'));
    expect(next).not.toHaveBeenCalled();

    rerender(
      <TimeStep
        draft={{ interests: [], dailyTime: '08:00' }}
        patch={vi.fn()}
        next={next}
        finish={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Next →'));
    expect(next).toHaveBeenCalledOnce();
  });
});
