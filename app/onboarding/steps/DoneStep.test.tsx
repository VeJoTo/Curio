import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StepProps } from '../types';
import { DoneStep } from './DoneStep';

afterEach(cleanup);

function renderStep(finish: StepProps['finish']) {
  const props: StepProps = {
    draft: { name: 'Vera', avatarKey: 'avatar-fox', interests: [] },
    patch: () => {},
    next: () => {},
    finish,
  };
  render(<DoneStep {...props} />);
}

describe('DoneStep', () => {
  it('runs finish when "Start exploring" is pressed', async () => {
    const finish = vi.fn().mockResolvedValue(undefined);
    renderStep(finish);
    fireEvent.click(screen.getByText('Start exploring →'));
    await waitFor(() => expect(finish).toHaveBeenCalledOnce());
    expect(screen.queryByText(/couldn't finish/i)).toBeNull();
  });

  it('surfaces an error and allows retry when finish fails', async () => {
    const finish = vi
      .fn()
      .mockRejectedValueOnce(new Error('save failed'))
      .mockResolvedValueOnce(undefined);
    renderStep(finish);

    fireEvent.click(screen.getByText('Start exploring →'));
    expect(await screen.findByText(/couldn't finish/i)).toBeTruthy();

    // The draft is untouched, so pressing the retry button retries; the second
    // attempt succeeds and clears the error.
    fireEvent.click(screen.getByText('Try again →'));
    await waitFor(() => expect(finish).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(/couldn't finish/i)).toBeNull());
  });
});
