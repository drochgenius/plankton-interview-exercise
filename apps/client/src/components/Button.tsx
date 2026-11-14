import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.scss';

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={styles.button} />;
}

export function ButtonLink(props: LinkProps) {
  return <Link {...props} className={styles.button} />;
}
