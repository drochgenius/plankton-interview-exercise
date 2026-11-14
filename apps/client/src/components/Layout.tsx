import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Layout.module.scss';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <Link to="/" className={styles.brand}>
        <span aria-hidden="true">🧠</span> Quiz Time
      </Link>
      {children}
    </main>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <section className={styles.card}>{children}</section>;
}

/** The main button goes here, with an optional hint that says why it is off. */
export function Actions({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className={styles.actions}>
      {children}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export function ErrorBox({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className={styles.error} role="alert">
      <p>{message}</p>
      {detail && <p className={styles.errorDetail}>{detail}</p>}
    </div>
  );
}
