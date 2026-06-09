import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TimePicker } from './TimePicker';

afterEach(cleanup);

describe('TimePicker custom mode', () => {
  it('can return to presets after opening custom, and explains its constraints', () => {
    render(<TimePicker onChange={() => {}} />);

    // Presets visible first.
    expect(screen.getByText('🌅 Morning · 8:00')).toBeTruthy();

    fireEvent.click(screen.getByText('Custom…'));
    // Custom mode communicates the step/format constraints …
    expect(screen.getByText('15-minute steps · 24-hour clock')).toBeTruthy();
    // … and presets are no longer shown.
    expect(screen.queryByText('🌅 Morning · 8:00')).toBeNull();

    // The new back affordance returns to presets.
    fireEvent.click(screen.getByText('← Back to presets'));
    expect(screen.getByText('🌅 Morning · 8:00')).toBeTruthy();
    expect(screen.queryByText('15-minute steps · 24-hour clock')).toBeNull();
  });
});
