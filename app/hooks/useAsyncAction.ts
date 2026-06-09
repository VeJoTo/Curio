import { useCallback, useEffect, useRef, useState } from 'react';

// Tracks an async action's in-flight state. `run` is a no-op if the action is
// already running (synchronous double-submit guard) and skips the final state
// update if the component unmounted mid-flight (these actions navigate away on
// success).
export function useAsyncAction(action: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setPending(true);
    try {
      await action();
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setPending(false);
      }
    }
  }, [action]);

  return { pending, run };
}
