import styles from './QuizProgress.module.scss';

export interface QuizProgressProps {
  total: number;
  completed: number;
  /** Index of the current question, or null on the intro and result pages. */
  current: number | null;
}

export function QuizProgress({ total, completed, current }: QuizProgressProps) {
  const left = total - completed - (current === null ? 0 : 1);
  const text =
    current === null
      ? `${total} questions · ${completed} done · ${left} left`
      : `Question ${current + 1} of ${total} · ${completed} done · ${left} left`;

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label="Quiz progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-valuetext={text}
    >
      <div className={styles.segments}>
        {Array.from({ length: total }, (_, index) => {
          const state =
            index === current ? 'current' : index < completed ? 'completed' : 'remaining';
          return (
            <span
              key={index}
              data-testid="segment"
              data-state={state}
              className={`${styles.segment} ${state === 'remaining' ? '' : styles[state]}`}
            />
          );
        })}
      </div>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
