import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Text } from './Text';

afterEach(cleanup);

describe('Text', () => {
  it('forwards accessibilityRole so a heading exposes the heading role', () => {
    render(
      <Text variant="title" accessibilityRole="header">
        Hello
      </Text>,
    );
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeTruthy();
  });
});
