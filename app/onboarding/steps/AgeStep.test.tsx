import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OnboardingDraft, StepProps } from '../types';
import { AgeStep } from './AgeStep';

afterEach(cleanup);

function renderStep(
  overrides: Partial<StepProps> = {},
  draft: OnboardingDraft = { interests: [] },
) {
  const props: StepProps = {
    draft,
    patch: vi.fn(),
    next: vi.fn(),
    finish: vi.fn(),
    ...overrides,
  };
  render(<AgeStep {...props} />);
  return props;
}

describe('AgeStep', () => {
  it('selecting an age updates the draft but does not auto-advance', () => {
    const patch = vi.fn();
    const next = vi.fn();
    renderStep({ patch, next });
    fireEvent.click(screen.getByText('18–24'));
    expect(patch).toHaveBeenCalledWith({ ageBand: '18-24' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Next is disabled until an age is selected, then advances', () => {
    const next = vi.fn();
    const { rerender } = render(
      <AgeStep draft={{ interests: [] }} patch={vi.fn()} next={next} finish={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('Next →'));
    expect(next).not.toHaveBeenCalled();

    rerender(
      <AgeStep
        draft={{ interests: [], ageBand: '18-24' }}
        patch={vi.fn()}
        next={next}
        finish={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Next →'));
    expect(next).toHaveBeenCalledOnce();
  });
});
