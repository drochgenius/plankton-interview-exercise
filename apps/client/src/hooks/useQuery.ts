import { useCallback, useEffect, useState } from 'react';

export type QueryState<T> =
  { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };

interface Settled<T> {
  load: () => Promise<T>;
  attempt: number;
  state: QueryState<T>;
}

/** Runs `load` on mount (and when it changes). `reload` runs it again. */
export function useQuery<T>(load: () => Promise<T>): QueryState<T> & { reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const finish = (state: QueryState<T>) => {
      if (!cancelled) setSettled({ load, attempt, state });
    };
    load().then(
      (data) => finish({ status: 'success', data }),
      (error: unknown) =>
        finish({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  // A result only counts if it belongs to the current load function and attempt.
  const current: QueryState<T> =
    settled && settled.load === load && settled.attempt === attempt
      ? settled.state
      : { status: 'loading' };
  return { ...current, reload };
}
