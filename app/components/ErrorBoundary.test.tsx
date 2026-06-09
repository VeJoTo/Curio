import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

afterEach(cleanup);

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders the fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary renderFallback={() => <Text>Recovery screen</Text>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovery screen')).toBeTruthy();
    spy.mockRestore();
  });

  it('recovers when reset is called and the child no longer throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Child() {
      if (shouldThrow) {
        throw new Error('kaboom');
      }
      return <Text>Healthy</Text>;
    }
    render(
      <ErrorBoundary
        renderFallback={(reset) => (
          <Text
            onPress={() => {
              shouldThrow = false;
              reset();
            }}
          >
            Try again
          </Text>
        )}
      >
        <Child />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Healthy')).toBeTruthy();
    spy.mockRestore();
  });
});
