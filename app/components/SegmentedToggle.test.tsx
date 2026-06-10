import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SegmentedToggle } from './SegmentedToggle';

afterEach(cleanup);

describe('SegmentedToggle', () => {
  it('exposes the group accessibilityLabel so the toggle purpose is announced', () => {
    render(
      <SegmentedToggle
        accessibilityLabel="Default depth"
        options={['Quick', 'Deep']}
        value="Quick"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Default depth' })).toBeTruthy();
  });
});
