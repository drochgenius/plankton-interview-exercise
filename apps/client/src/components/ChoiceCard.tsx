import type { Choice } from 'shared-types';
import { MathText } from './MathText';
import styles from './ChoiceCard.module.scss';

interface ChoiceCardProps {
  name: string;
  choice: Choice;
  selected: boolean;
  onSelect: (choiceId: string) => void;
}

export function ChoiceCard({ name, choice, selected, onSelect }: ChoiceCardProps) {
  return (
    <label className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <input
        type="radio"
        className={styles.input}
        name={name}
        value={choice.id}
        checked={selected}
        onChange={() => onSelect(choice.id)}
      />
      <span className={styles.letter} aria-hidden="true">
        {choice.id.toUpperCase()}
      </span>
      <span className={styles.text}>
        <MathText text={choice.text} />
      </span>
      {selected && (
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
      )}
    </label>
  );
}
