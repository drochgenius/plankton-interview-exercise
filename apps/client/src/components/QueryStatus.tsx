import { Button } from './Button';
import { ErrorBox } from './Layout';

export function Loading() {
  return (
    <p role="status" aria-live="polite">
      Loading…
    </p>
  );
}

export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <>
      <ErrorBox message={`Oops! We could not load ${what}. Please try again.`} />
      <p>
        <Button onClick={onRetry}>Try again</Button>
      </p>
    </>
  );
}
