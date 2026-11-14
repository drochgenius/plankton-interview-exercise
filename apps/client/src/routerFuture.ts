import type { FutureConfig } from 'react-router-dom';

/** Opt in to React Router 7 behavior now. This also silences its upgrade warnings. */
export const routerFuture: Partial<FutureConfig> = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};
