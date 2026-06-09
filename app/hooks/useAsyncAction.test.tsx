import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncAction } from './useAsyncAction';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useAsyncAction', () => {
  it('toggles pending around the action', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => useAsyncAction(action));

    expect(result.current.pending).toBe(false);

    act(() => {
      void result.current.run();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));

    await act(async () => {
      d.resolve();
      await d.promise;
    });
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ignores a second run while one is in flight (double-submit guard)', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => useAsyncAction(action));

    act(() => {
      void result.current.run();
      void result.current.run();
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await d.promise;
    });
  });

  it('does not throw when run resolves after unmount', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    // React 18 silently ignores state updates on an unmounted component (no
    // legacy warning), so the mountedRef guard isn't directly observable. We at
    // least assert nothing errors/warns when the action resolves post-unmount.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useAsyncAction(action));

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.run();
    });
    unmount();
    await act(async () => {
      d.resolve();
      await runPromise;
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
