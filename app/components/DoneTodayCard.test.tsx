import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DoneTodayCard } from './DoneTodayCard';

afterEach(cleanup);

describe('DoneTodayCard', () => {
  it('shows the streak and fires onReadAgain', () => {
    const onReadAgain = vi.fn();
    render(<DoneTodayCard streak={4} onReadAgain={onReadAgain} />);
    expect(screen.getByText('🔥 4-day streak')).toBeTruthy();
    fireEvent.click(screen.getByText('Read it again'));
    expect(onReadAgain).toHaveBeenCalledOnce();
  });

  it('uses a gentle first-day message at streak 1', () => {
    render(<DoneTodayCard streak={1} onReadAgain={() => {}} />);
    expect(screen.getByText('Day 1 — nice start')).toBeTruthy();
    expect(screen.queryByText('🔥 1-day streak')).toBeNull();
  });
});
